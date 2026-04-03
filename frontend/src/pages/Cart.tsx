import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveFromCart } from '../api/hooks';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const Cart = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading, error } = useCart();
  const { mutateAsync: updateQty, isPending: isUpdating } = useUpdateCartItem();
  const { mutateAsync: remove, isPending: isRemoving } = useRemoveFromCart();

  if (isLoading) return <div className="py-40 text-center animate-pulse uppercase tracking-widest text-muted">Loading Cart...</div>;
  if (error || !cart || cart.items.length === 0) return (
    <div className="text-center py-40 animate-fade-in">
      <h2 className="text-3xl font-light mb-6">Your Cart is Empty</h2>
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-bold border-b border-white pb-1 hover:text-muted transition-colors">
        Continue Shopping <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 animate-slide-up">
      <h1 className="text-3xl font-light mb-12 uppercase tracking-widest border-b border-border pb-6 flex items-center justify-between">
        Shopping Bag <span className="text-lg text-muted">{cart.items.length} items</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-8 group py-8 border-b border-border last:border-0 relative">
              {(isUpdating || isRemoving) && <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm" />}
              <div className="w-40 aspect-square bg-surface p-4 flex items-center justify-center rounded-sm">
                {item.product?.media_urls?.[0] ? (
                  <img src={item.product?.media_urls?.[0]} alt={item.title_snapshot || item.product?.name} className="object-contain w-full h-full mix-blend-screen" />
                ) : (
                  <span className="text-muted tracking-widest uppercase text-[10px]">No Image</span>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-tight mb-2 hover:underline">
                    {item.product_id ? (
                      <Link to={`/products/${item.product_id}`}>{item.title_snapshot || item.product?.name}</Link>
                    ) : (
                      <span>{item.title_snapshot || 'Custom Build'}</span>
                    )}
                  </h3>
                  <p className="text-muted text-[10px] uppercase tracking-wider">{item.item_type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-4 text-sm font-mono border border-border">
                    <button 
                      onClick={() => updateQty({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      className="w-10 h-10 flex items-center justify-center hover:bg-surface text-muted"
                    >-</button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQty({ itemId: item.id, quantity: item.quantity + 1 })}
                      className="w-10 h-10 flex items-center justify-center hover:bg-surface text-muted"
                    >+</button>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-sm font-bold text-muted hover:text-red-400 transition-colors uppercase tracking-widest">Remove</button>
                  <p className="text-xl font-bold">{formatCurrency(item.unit_estimated_price_tzs)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surfaceElevated p-8 rounded-sm sticky top-24 h-fit border border-border">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-8 border-b border-border pb-4">Order Summary</h2>
          <div className="space-y-4 text-sm mb-8 text-muted">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(cart.estimated_total_tzs)}</span></div>
            <div className="flex justify-between"><span>Estimated Shipping</span><span>Calculated at checkout</span></div>
            <div className="flex justify-between"><span>Taxes</span><span>Calculated at checkout</span></div>
          </div>
          <div className="border-t border-border pt-6 flex justify-between font-bold text-2xl mb-8">
            <span>Total</span>
            <span>{formatCurrency(cart.estimated_total_tzs)}</span>
          </div>
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full bg-white text-black py-5 uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
          >
            Checkout via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};