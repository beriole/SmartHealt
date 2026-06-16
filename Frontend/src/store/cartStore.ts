import { create } from 'zustand';
import { StockItem } from '@/types';

export interface CartLine {
  id_stock: string;
  id_medicament: string;
  nom: string;
  prix: number;
  quantite: number;
  quantite_max: number;
}

interface AddResult {
  ok: boolean;
  /** true si l'article provient d'une autre pharmacie que le panier courant. */
  conflict?: boolean;
}

interface CartState {
  id_pharmacie: string | null;
  nom_pharmacie: string | null;
  items: CartLine[];
  /** Ajoute un stock au panier. Refuse (conflict) si pharmacie différente. */
  add: (stock: StockItem, force?: boolean) => AddResult;
  remove: (id_stock: string) => void;
  setQty: (id_stock: string, quantite: number) => void;
  clear: () => void;
}

function pharmacieIdOf(stock: StockItem): string {
  return stock.pharmacie?.id_pharmacie ?? stock.id_pharmacie;
}

export const useCartStore = create<CartState>((set, get) => ({
  id_pharmacie: null,
  nom_pharmacie: null,
  items: [],

  add: (stock, force = false) => {
    const state = get();
    const stockPharmacieId = pharmacieIdOf(stock);

    const differentPharmacie =
      state.items.length > 0 && state.id_pharmacie !== stockPharmacieId;

    if (differentPharmacie && !force) {
      return { ok: false, conflict: true };
    }

    const base = differentPharmacie ? [] : state.items;
    const existing = base.find(l => l.id_stock === stock.id_stock);
    const prix = Number(stock.prix_vente_fcfa);

    let items: CartLine[];
    if (existing) {
      items = base.map(l =>
        l.id_stock === stock.id_stock
          ? {
              ...l,
              quantite: Math.min(l.quantite + 1, l.quantite_max),
            }
          : l,
      );
    } else {
      items = [
        ...base,
        {
          id_stock: stock.id_stock,
          id_medicament: stock.id_medicament,
          nom: stock.medicament.nom_commercial,
          prix,
          quantite: 1,
          quantite_max: stock.quantite_disponible,
        },
      ];
    }

    set({
      items,
      id_pharmacie: stockPharmacieId,
      nom_pharmacie: stock.pharmacie?.nom_pharmacie ?? state.nom_pharmacie,
    });
    return { ok: true };
  },

  remove: id_stock => {
    const items = get().items.filter(l => l.id_stock !== id_stock);
    set(
      items.length === 0
        ? { items, id_pharmacie: null, nom_pharmacie: null }
        : { items },
    );
  },

  setQty: (id_stock, quantite) => {
    const items = get()
      .items.map(l =>
        l.id_stock === id_stock
          ? { ...l, quantite: Math.max(1, Math.min(quantite, l.quantite_max)) }
          : l,
      );
    set({ items });
  },

  clear: () => set({ items: [], id_pharmacie: null, nom_pharmacie: null }),
}));

/** Sélecteurs dérivés. */
export const selectCartCount = (s: CartState) =>
  s.items.reduce((n, l) => n + l.quantite, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, l) => sum + l.prix * l.quantite, 0);
