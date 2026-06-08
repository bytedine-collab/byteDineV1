import React from 'react';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed',
  preparing: 'Preparing', ready: 'Ready', served: 'Served', completed: 'Completed'
};
const STATUS_TONE = {
  pending: 'bg-yellow-500/5 border-yellow-500/20',
  confirmed: 'bg-blue-500/5 border-blue-500/20',
  preparing: 'bg-orange-500/5 border-orange-500/20',
  ready: 'bg-green-500/5 border-green-500/20',
  served: 'bg-purple-500/5 border-purple-500/20',
  completed: 'bg-white/5 border-white/10',
};

export default function OrderTracker({ orders, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <section className="animate-slide-up rounded-t-3xl border-t border-white/10 bg-ash shadow-2xl max-h-[82vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">📋 {t('orderStatus')}</h2>
            <p className="text-xs text-gray-500">Live kitchen updates</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 text-gray-300 hover:bg-white/10 active:scale-95">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active orders</p>
          ) : (
            orders.map(order => {
              const currentIdx = Math.max(0, STATUS_STEPS.indexOf(order.status));
              return (
                <article key={order._id} className={`rounded-3xl border p-4 ${STATUS_TONE[order.status] || STATUS_TONE.pending}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-display text-base font-bold text-white">{t('orderNumber')}{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center">
                    {STATUS_STEPS.map((step, idx) => {
                      const done = idx < currentIdx;
                      const active = idx === currentIdx;
                      return (
                        <React.Fragment key={step}>
                          <div className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            done ? 'bg-flame text-white' :
                            active ? 'bg-flame text-white animate-pulse shadow-glow-md' :
                            'bg-coal text-gray-600 border border-white/10'
                          }`}>
                            {done ? '✓' : idx + 1}
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 border-t border-dashed ${idx < currentIdx ? 'border-orange-400' : 'border-white/10'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-2xl bg-coal/70 px-3 py-2 text-sm">
                        <span className="text-gray-300"><span className="font-bold text-orange-300">{item.quantity}x</span> {item.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'ready' ? 'bg-green-500/15 text-green-300' :
                          item.status === 'preparing' ? 'bg-orange-500/15 text-orange-300' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between border-t border-white/10 pt-3">
                    <span className="text-sm text-gray-400">{t('total')}</span>
                    <span className="text-sm font-extrabold text-orange-300">₹{order.total}</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
