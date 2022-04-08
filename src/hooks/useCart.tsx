import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      if (productId) {
        const product = await api.get(`products/${productId}`);
        const productStock = await api.get(`stock/${productId}`);
        const hasProductInTheCart = cart.find((item) => item.id === productId);
        const hasProductStock = productStock.data.amount > 0;

        if (hasProductStock) {
          if (hasProductInTheCart) {
            updateProductAmount({
              productId,
              amount: hasProductInTheCart.amount + 1,
            });
          } else {
            const addNewProduct = [...cart, { ...product.data, amount: 1 }];
            localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify(addNewProduct)
            );
            setCart(addNewProduct);
          }
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    const productIndex = cart.findIndex((product) => product.id === productId);
    if (productIndex > -1) {
      debugger;
      const newCart = cart.filter((item) => item.id !== productId);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } else {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = await api.get(`stock/${productId}`);
      if (productStock.data) {
        if (amount <= productStock.data.amount && amount > 0) {
          const productsWithNewAmount = cart.map((item) => {
            return item.id === productId ? { ...item, amount: amount } : item;
          });

          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(productsWithNewAmount)
          );
          setCart(productsWithNewAmount);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return useContext(CartContext);
}
