import { ParsedWhatsAppResult } from '../types';

/**
 * Intelligent WhatsApp list parser for Arena Romano.
 * Parses dates, times, game descriptions and player names (including 12+1 format and emojis).
 */
export function parseWhatsAppText(rawText: string): ParsedWhatsAppResult {
  const warnings: string[] = [];
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return {
      title: 'Jogo Arena Romano',
      date: getTodayDateString(),
      time: '20:00',
      court_price: 200,
      players: [],
      warnings: ['Nenhum texto informado para importação.'],
    };
  }

  // 1. Extract Time
  let time = '20:00';
  let timeFound = false;
  // Regex for variations: "20 horas", "20 hrs", "20hs", "20h", "20:00", "20h30", "19:30"
  const timeRegexes = [
    /\b([01]?\d|2[0-3])[:hH]([0-5]\d)\b/, // 20:00, 20h30, 19:30
    /\b([01]?\d|2[0-3])\s*(?:horas|hora|hrs|hr|hs|h)\b/i, // 20 horas, 20 hrs, 20h
    /\bàs\s+([01]?\d|2[0-3])(?:[:hH]([0-5]\d))?\b/i, // às 20h, às 20:00
  ];

  for (const line of lines) {
    for (const regex of timeRegexes) {
      const match = line.match(regex);
      if (match) {
        let hour = parseInt(match[1], 10);
        let minute = match[2] ? parseInt(match[2], 10) : 0;
        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
          time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          timeFound = true;
          break;
        }
      }
    }
    if (timeFound) break;
  }

  // 2. Extract Date / Day of Week
  let date = getTodayDateString();
  const dayNamesMap: { [key: string]: number } = {
    domingo: 0,
    segunda: 1,
    'segunda-feira': 1,
    terça: 2,
    terca: 2,
    'terça-feira': 2,
    'terca-feira': 2,
    quarta: 3,
    'quarta-feira': 3,
    quinta: 4,
    'quinta-feira': 4,
    sexta: 5,
    'sexta-feira': 5,
    sábado: 6,
    sabado: 6,
  };

  // Check explicit date "DD/MM" or "DD/MM/YYYY"
  let dateFound = false;
  for (const line of lines) {
    const dateMatch = line.match(/\b([0-3]?\d)[\/\-\.]([01]?\d)(?:[\/\-\.](\d{2,4}))?\b/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dateFound = true;
        break;
      }
    }
  }

  // If no explicit date, check day of week
  if (!dateFound) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const [dayName, targetDayNum] of Object.entries(dayNamesMap)) {
        if (lower.includes(dayName)) {
          date = getDateForNextDayOfWeek(targetDayNum);
          dateFound = true;
          break;
        }
      }
      if (dateFound) break;
    }
  }

  // 3. Extract Game Title
  let title = '';
  // Candidate lines that don't start with numbers or bullet points
  const candidateHeaderLines: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    // If it's clearly a player entry like "1 Benhur" or "12+1 luis", stop considering header lines
    if (/^\s*(\d+(\+\d+)?|[-*•])[\s\.\-\):]/.test(line)) {
      break;
    }
    candidateHeaderLines.push(line);
  }

  if (candidateHeaderLines.length > 0) {
    // If line 0 is "Lista treino de TERÇA-FEIRA 20 horas" and line 1 is "Churrasco do Bigode", pick line 1
    if (candidateHeaderLines.length >= 2) {
      const first = candidateHeaderLines[0];
      const second = candidateHeaderLines[1];
      if (/lista|treino|jogo|horário|horario/i.test(first) && !/lista|treino/i.test(second)) {
        title = second;
      } else {
        // Clean line 0 or 1
        title = candidateHeaderLines.find(l => !/^(lista|confirmados|hor[aá]rio|dia)/i.test(l)) || candidateHeaderLines[0];
      }
    } else {
      title = candidateHeaderLines[0];
    }
  }

  // Clean title
  title = title
    .replace(/^lista\s*(de\s*)?(treino|jogo|futebol|futsal|pelada)?\s*(de|do|da)?\s*/i, '')
    .replace(/\b(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(-feira)?\b/gi, '')
    .replace(/\b\d+\s*(horas|hrs|hs|h|:00)\b/gi, '')
    .trim();

  if (!title || title.length < 3) {
    title = `Jogo das ${time}`;
  }

  // 4. Extract Players List
  const players: Array<{ name: string; raw_tag?: string; original_line: string }> = [];
  const ignoredWords = /^(lista|confirmados|reservas|espera|goleiros|mensalistas|avulsos|regras|obs|pagamento|pix|valor|local|quadra|arena|traje|uniforme)[:\s]*$/i;

  for (const line of lines) {
    // Skip candidate headers already used or meta lines
    if (ignoredWords.test(line)) continue;
    if (line === rawText.split('\n')[0] && candidateHeaderLines.includes(line) && lines.length > 3) continue;

    // Pattern 1: Special "+1" or "12+1 luis" or "10+1 nome"
    const additionMatch = line.match(/^(\d+\+\d+)\s*[-.:)]?\s*(.+)$/i);
    if (additionMatch) {
      const rawTag = additionMatch[1].trim();
      const rawName = additionMatch[2].trim();
      if (rawName && !ignoredWords.test(rawName)) {
        players.push({
          name: formatPlayerName(rawName),
          raw_tag: rawTag,
          original_line: line,
        });
        continue;
      }
    }

    // Pattern 2: Numbered item "1 Benhur", "02. Mateus", "3 - Joninhas", "4) Vaner"
    const numberedMatch = line.match(/^(\d{1,3})[\s\.\-\):]+\s*(.+)$/);
    if (numberedMatch) {
      const rawName = numberedMatch[2].trim();
      // Check if it's a valid player name (not "horas" or "jogadores")
      if (rawName && !/^\d+\s*(horas|hrs|hs|jogadores)/i.test(rawName) && !ignoredWords.test(rawName)) {
        players.push({
          name: formatPlayerName(rawName),
          original_line: line,
        });
        continue;
      }
    }

    // Pattern 3: Bullet points "- Benhur", "* Mateus", "• Joninhas"
    const bulletMatch = line.match(/^[-*•]\s*(.+)$/);
    if (bulletMatch) {
      const rawName = bulletMatch[1].trim();
      if (rawName && !ignoredWords.test(rawName)) {
        players.push({
          name: formatPlayerName(rawName),
          original_line: line,
        });
        continue;
      }
    }

    // Pattern 4: Name alone if after a numbered list started or inside a clearly defined players block
    if (players.length > 0 && line.length > 1 && line.length < 40 && !ignoredWords.test(line)) {
      if (!/^\d+\s*(horas|hrs|reais)/i.test(line) && !/^(data|hor[aá]rio|local|valor)/i.test(line)) {
        players.push({
          name: formatPlayerName(line),
          original_line: line,
        });
      }
    }
  }

  if (players.length === 0) {
    warnings.push('Nenhum jogador identificado na formatação padrão (ex: "1 Nome", "12+1 Nome"). Você pode adicionar manualmente.');
  }

  // Default court price based on standard arena schedule
  const courtPrice = parseInt(time.split(':')[0], 10) >= 20 ? 200 : 150;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    date,
    time,
    court_price: courtPrice,
    players,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Cleans and capitalizes player names while preserving emojis and special nicknames.
 */
function formatPlayerName(rawName: string): string {
  // Trim spaces and weird symbols at start/end
  let cleaned = rawName.replace(/^[\s\-–—.:,]+|[\s\-–—.:,]+$/g, '').trim();

  // If name has emojis, preserve them! e.g. "Bigode🎂", "Codorna 🥅"
  // Keep the emojis intact.
  return cleaned;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateForNextDayOfWeek(targetDayOfWeek: number): string {
  const now = new Date();
  const currentDay = now.getDay();
  let distance = targetDayOfWeek - currentDay;
  if (distance < 0) {
    distance += 7; // Next week's same day
  }
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + distance);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
