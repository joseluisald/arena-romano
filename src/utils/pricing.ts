import { Product, ProductPriceTier } from '../types';

export interface PriceCalculationResult {
  total: number;
  regularTotal: number;
  savings: number;
  breakdown: string;
  combination: Array<{ quantity: number; price: number; count: number }>;
}

/**
 * Calculates optimal price for a given quantity based on progressive price tiers
 * using dynamic programming to guarantee the lowest cost combination.
 */
export function calculateOptimalProductPrice(product: Product, quantity: number): PriceCalculationResult {
  if (quantity <= 0) {
    return {
      total: 0,
      regularTotal: 0,
      savings: 0,
      breakdown: '0x R$ 0,00',
      combination: [],
    };
  }

  // Ensure base tier (1 unit = unit_price) is present
  const availableTiers: ProductPriceTier[] = [...(product.price_tiers || [])];
  
  const hasBaseTier = availableTiers.some(t => t.quantity === 1);
  if (!hasBaseTier) {
    availableTiers.push({ quantity: 1, price: product.unit_price });
  }

  // Remove invalid tiers (quantity <= 0 or price <= 0)
  const validTiers = availableTiers.filter(t => t.quantity > 0 && t.price >= 0);

  // DP table to find minimum cost for each quantity from 0 to N
  const dp: number[] = new Array(quantity + 1).fill(Infinity);
  const choice: number[] = new Array(quantity + 1).fill(-1); // index of tier used
  dp[0] = 0;

  for (let i = 1; i <= quantity; i++) {
    for (let tIdx = 0; tIdx < validTiers.length; tIdx++) {
      const tier = validTiers[tIdx];
      if (i >= tier.quantity) {
        const cost = dp[i - tier.quantity] + tier.price;
        if (cost < dp[i]) {
          dp[i] = cost;
          choice[i] = tIdx;
        }
      }
    }
    // Fallback if no tier fits
    if (dp[i] === Infinity) {
      dp[i] = dp[i - 1] + product.unit_price;
    }
  }

  const optimalTotal = dp[quantity];
  const regularTotal = quantity * product.unit_price;
  const savings = Math.max(0, regularTotal - optimalTotal);

  // Reconstruct chosen tiers
  const tierCounts: { [tierKey: string]: { tier: ProductPriceTier; count: number } } = {};
  let currentQty = quantity;

  while (currentQty > 0) {
    const tIdx = choice[currentQty];
    if (tIdx >= 0) {
      const tier = validTiers[tIdx];
      const key = `${tier.quantity}-${tier.price}`;
      if (!tierCounts[key]) {
        tierCounts[key] = { tier, count: 0 };
      }
      tierCounts[key].count++;
      currentQty -= tier.quantity;
    } else {
      // Fallback
      currentQty -= 1;
    }
  }

  const combination = Object.values(tierCounts)
    .sort((a, b) => b.tier.quantity - a.tier.quantity)
    .map(tc => ({
      quantity: tc.tier.quantity,
      price: tc.tier.price,
      count: tc.count,
    }));

  const breakdownParts = combination.map(c => {
    if (c.quantity === 1) {
      return `${c.count}x R$ ${c.price.toFixed(2).replace('.', ',')}`;
    }
    return `${c.count}x [Combo ${c.quantity} un = R$ ${c.price.toFixed(2).replace('.', ',')}]`;
  });

  const breakdown = breakdownParts.join(' + ') || `${quantity}x R$ ${product.unit_price.toFixed(2).replace('.', ',')}`;

  return {
    total: Math.round(optimalTotal * 100) / 100,
    regularTotal: Math.round(regularTotal * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    breakdown,
    combination,
  };
}

/**
 * Formats a currency amount into Brazilian Real (e.g. R$ 25,00)
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
