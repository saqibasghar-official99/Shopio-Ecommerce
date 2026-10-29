// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { Search, Filter, Eye, ChevronDown, ChevronUp, Package, Trash2 } from 'lucide-react';
// import DataTable from '@/components/admin/DataTable';
// import Pagination from '@/components/admin/Pagination';
// import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Separator } from '@/components/ui/separator';
// import {
//   formatCurrency,
//   cn,
//   getOrderStatusColor,
//   getPaymentStatusColor,
//   ORDER_STATUSES,
//   PAYMENT_STATUSES,
// } from '@/lib/utils';
// import type { Order, OrderItem } from '@/lib/types';

// export default function AdminOrdersPage() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(20);

//   // Filters
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [paymentFilter, setPaymentFilter] = useState('all');
//   const [search, setSearch] = useState('');
//   const [dateFrom, setDateFrom] = useState('');
//   const [dateTo, setDateTo] = useState('');

//   // Detail dialog
//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
//   const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//       });
//       if (statusFilter !== 'all') params.set('status', statusFilter);
//       if (paymentFilter !== 'all') params.set('payment_status', paymentFilter);
//       if (search) params.set('search', search);
//       if (dateFrom) params.set('date_from', dateFrom);
//       if (dateTo) params.set('date_to', dateTo);

//       const res = await fetch(`/api/orders?${params}`);
//       if (res.ok) {
//         const result = await res.json();
//         const ordersData = result.success ? (result.data || []) : (Array.isArray(result) ? result : result.orders || []);
//         const mapped = ordersData.map((o: Record<string, unknown>) => ({ ...o, id: (o as Record<string, unknown>)._id || o.id }));
//         setOrders(mapped);
//         setTotal(result.pagination?.total || result.total || mapped.length || 0);
//       }
//     } catch (err) {
//       console.error('Failed to fetch orders', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, limit, statusFilter, paymentFilter, search, dateFrom, dateTo]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   const updateOrderStatus = async (orderNumber: string, newStatus: string) => {
//     setUpdatingStatus(orderNumber);
//     try {
//       const res = await fetch(`/api/orders/${orderNumber}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ order_status: newStatus }),
//       });
//       if (res.ok) {
//         setOrders((prev) =>
//           prev.map((o) => (o.order_number === orderNumber ? { ...o, order_status: newStatus } : o))
//         );
//         if (selectedOrder?.order_number === orderNumber) {
//           setSelectedOrder((prev) => prev ? { ...prev, order_status: newStatus } : null);
//         }
//       }
//     } catch (err) {
//       console.error('Failed to update order status', err);
//     } finally {
//       setUpdatingStatus(null);
//     }
//   };

//   const updatePaymentStatus = async (orderNumber: string, newStatus: string) => {
//     setUpdatingPayment(orderNumber);
//     try {
//       const res = await fetch(`/api/orders/${orderNumber}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ payment_status: newStatus }),
//       });
//       if (res.ok) {
//         setOrders((prev) =>
//           prev.map((o) => (o.order_number === orderNumber ? { ...o, payment_status: newStatus } : o))
//         );
//         if (selectedOrder?.order_number === orderNumber) {
//           setSelectedOrder((prev) => prev ? { ...prev, payment_status: newStatus } : null);
//         }
//       }
//     } catch (err) {
//       console.error('Failed to update payment status', err);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };

//   const deleteOrder = async (orderNumber: string) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`
//     );

//     if (!confirmed) return;

//     try {
//       const res = await fetch(`/api/orders/${orderNumber}`, {
//         method: 'DELETE',
//       });

//       if (!res.ok) {
//         const error = await res.json().catch(() => ({}));
//         throw new Error(error.message || 'Failed to delete order');
//       }

//       // Remove the deleted order immediately from the current table
//       setOrders((prev) =>
//         prev.filter((order) => order.order_number !== orderNumber)
//       );

//       // Update total count
//       setTotal((prev) => Math.max(0, prev - 1));

//       // Close detail dialog if the deleted order is open
//       if (selectedOrder?.order_number === orderNumber) {
//         setSelectedOrder(null);
//       }
//     } catch (err) {
//       console.error('Failed to delete order', err);
//       alert(err instanceof Error ? err.message : 'Failed to delete order');
//     }
//   };

//   const columns = [
//     {
//       key: 'order_number',
//       label: 'Order #',
//       render: (row: Record<string, unknown>) => (
//         <button
//           onClick={() => setSelectedOrder(row as unknown as Order)}
//           className="font-medium text-green-600 hover:text-green-700"
//         >
//           {row.order_number as string}
//         </button>
//       ),
//     },
//     { key: 'customer_name', label: 'Customer' },
//     {
//       key: 'items',
//       label: 'Items',
//       render: (row: Record<string, unknown>) => (row.items as OrderItem[])?.length || 0,
//     },
//     {
//       key: 'total',
//       label: 'Total',
//       render: (row: Record<string, unknown>) => formatCurrency(row.total as number),
//     },
//     {
//       key: 'payment_status',
//       label: 'Payment',
//       render: (row: Record<string, unknown>) => {
//         const ps = row.payment_status as string;
//         return (
//           <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getPaymentStatusColor(ps))}>
//             {ps.charAt(0).toUpperCase() + ps.slice(1)}
//           </span>
//         );
//       },
//     },
//     {
//       key: 'order_status',
//       label: 'Status',
//       render: (row: Record<string, unknown>) => (
//         <OrderStatusBadge status={row.order_status as string} />
//       ),
//     },
//     {
//       key: 'created_at',
//       label: 'Date',
//       render: (row: Record<string, unknown>) => new Date(row.created_at as string).toLocaleDateString(),
//     },
//     {
//       key: 'shipping_label',
//       label: 'Label',
//       render: (row: Record<string, unknown>) => (
//         <a
//           href={`/api/shipping-label/${row.order_number as string}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-green-600 hover:text-green-700"
//           title="Download Shipping Label"
//         >
//           <Package className="h-4 w-4" />
//         </a>
//       ),
//     },
//     {
//       key: 'actions',
//       label: 'Actions',
//       render: (row: Record<string, unknown>) => {
//         const orderNumber = row.order_number as string;

//         return (
//           <div className="flex items-center gap-3">
//             {/* View */}
//             <button
//               type="button"
//               onClick={() => setSelectedOrder(row as unknown as Order)}
//               className="text-gray-400 hover:text-gray-600"
//               title="View Order"
//             >
//               <Eye className="h-4 w-4" />
//             </button>

//             {/* Delete */}
//             <button
//               type="button"
//               onClick={() => deleteOrder(orderNumber)}
//               className="text-red-500 hover:text-red-700"
//               title="Delete Order"
//             >
//               <Trash2 className="h-4 w-4" />
//             </button>
//           </div>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
//         <span className="text-xs text-gray-500">{total} total</span>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="flex flex-wrap items-end gap-3 p-4">
//           <div className="space-y-1">
//             <label className="text-xs text-gray-500">Status</label>
//             <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
//               <SelectTrigger className="h-8 w-36 text-xs">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
//                 {ORDER_STATUSES.map((s) => (
//                   <SelectItem key={s} value={s} className="text-xs">
//                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-1">
//             <label className="text-xs text-gray-500">Payment</label>
//             <Select value={paymentFilter} onValueChange={(val) => { setPaymentFilter(val); setPage(1); }}>
//               <SelectTrigger className="h-8 w-36 text-xs">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all" className="text-xs">All Payments</SelectItem>
//                 {PAYMENT_STATUSES.map((s) => (
//                   <SelectItem key={s} value={s} className="text-xs">
//                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-1">
//             <label className="text-xs text-gray-500">Search</label>
//             <div className="relative">
//               <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
//               <Input
//                 placeholder="Order # or customer..."
//                 value={search}
//                 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//                 className="h-8 w-48 pl-8 text-xs"
//               />
//             </div>
//           </div>

//           <div className="space-y-1">
//             <label className="text-xs text-gray-500">From</label>
//             <Input
//               type="date"
//               value={dateFrom}
//               onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
//               className="h-8 w-36 text-xs"
//             />
//           </div>

//           <div className="space-y-1">
//             <label className="text-xs text-gray-500">To</label>
//             <Input
//               type="date"
//               value={dateTo}
//               onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
//               className="h-8 w-36 text-xs"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* Orders Table */}
//       <DataTable
//         columns={columns}
//         data={orders as unknown as Record<string, unknown>[]}
//         loading={loading}
//       />
//       <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />

//       {/* Order Detail Dialog */}
//       <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="text-sm font-semibold">
//               Order {selectedOrder?.order_number}
//             </DialogTitle>
//           </DialogHeader>
//           {selectedOrder && (
//             <div className="space-y-4 text-xs">
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <span className="text-gray-500">Customer</span>
//                   <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Phone</span>
//                   <p className="font-medium text-gray-900">{selectedOrder.customer_phone}</p>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">City</span>
//                   <p className="font-medium text-gray-900">{selectedOrder.customer_city}</p>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Date</span>
//                   <p className="font-medium text-gray-900">
//                     {new Date(selectedOrder.created_at).toLocaleString()}
//                   </p>
//                 </div>
//               </div>

//               <Separator />

//               {/* Items */}
//               <div>
//                 <span className="text-gray-500">Items</span>
//                 <div className="mt-2 space-y-2">
//                   {selectedOrder.items.map((item, idx) => (
//                     <div key={idx} className="flex items-center justify-between rounded border p-2">
//                       <div className="flex items-center gap-2">
//                         {item.image && (
//                           <img src={item.image} alt={item.name} className="h-8 w-8 rounded object-cover" />
//                         )}
//                         <div>
//                           <p className="font-medium text-gray-900">{item.name}</p>
//                           {item.variant && <p className="text-gray-400">{item.variant}</p>}
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-gray-900">{item.qty} x {formatCurrency(item.unitPrice)}</p>
//                         <p className="font-medium text-gray-900">{formatCurrency(item.qty * item.unitPrice)}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <Separator />

//               {/* Totals */}
//               <div className="space-y-1">
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">Subtotal</span>
//                   <span>{formatCurrency(selectedOrder.subtotal)}</span>
//                 </div>
//                 {selectedOrder.discount > 0 && (
//                   <div className="flex justify-between text-green-600">
//                     <span>Discount</span>
//                     <span>-{formatCurrency(selectedOrder.discount)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">Delivery Fee</span>
//                   <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between font-semibold">
//                   <span>Total</span>
//                   <span>{formatCurrency(selectedOrder.total)}</span>
//                 </div>
//               </div>

//               <Separator />

//               {/* Status Controls */}
//               <div className="flex gap-4">
//                 <div className="flex-1 space-y-1">
//                   <span className="text-gray-500">Order Status</span>
//                   <Select
//                     value={selectedOrder.order_status}
//                     onValueChange={(val) => updateOrderStatus(selectedOrder.order_number, val)}
//                     disabled={updatingStatus === selectedOrder.order_number}
//                   >
//                     <SelectTrigger className="h-8 text-xs">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {ORDER_STATUSES.map((s) => (
//                         <SelectItem key={s} value={s} className="text-xs">
//                           {s.charAt(0).toUpperCase() + s.slice(1)}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="flex-1 space-y-1">
//                   <span className="text-gray-500">Payment Status</span>
//                   <Select
//                     value={selectedOrder.payment_status}
//                     onValueChange={(val) => updatePaymentStatus(selectedOrder.order_number, val)}
//                     disabled={updatingPayment === selectedOrder.order_number}
//                   >
//                     <SelectTrigger className="h-8 text-xs">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {PAYMENT_STATUSES.map((s) => (
//                         <SelectItem key={s} value={s} className="text-xs">
//                           {s.charAt(0).toUpperCase() + s.slice(1)}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {selectedOrder.notes && (
//                 <>
//                   <Separator />
//                   <div>
//                     <span className="text-gray-500">Notes</span>
//                     <p className="text-gray-900">{selectedOrder.notes}</p>
//                   </div>
//                 </>
//               )}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  Package,
  Trash2,
  MapPin,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';

import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';

import {
  formatCurrency,
  cn,
  getPaymentStatusColor,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '@/lib/utils';

import type { Order, OrderItem } from '@/lib/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // =========================================================
  // FILTERS
  // =========================================================

  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // =========================================================
  // DETAIL DIALOG
  // =========================================================

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [paymentScreenshot, setPaymentScreenshot] =
    useState<string | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState<string | null>(null);

  const [updatingPayment, setUpdatingPayment] =
    useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('0');
  const [savingRefund, setSavingRefund] = useState(false);

  useEffect(() => {
    setRefundAmount(String(selectedOrder?.refunded_amount || 0));
  }, [selectedOrder]);

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (paymentFilter !== 'all') {
        params.set('payment_status', paymentFilter);
      }

      if (search) {
        params.set('search', search);
      }

      if (dateFrom) {
        params.set('date_from', dateFrom);
      }

      if (dateTo) {
        params.set('date_to', dateTo);
      }

      const res = await fetch(`/api/orders?${params}`);

      if (res.ok) {
        const result = await res.json();

        const ordersData = result.success
          ? result.data || []
          : Array.isArray(result)
            ? result
            : result.orders || [];

        const mapped = ordersData.map(
          (o: Record<string, unknown>) => ({
            ...o,
            id:
              (o as Record<string, unknown>)._id ||
              o.id,
          })
        );

        setOrders(mapped);

        setTotal(
          result.pagination?.total ||
          result.total ||
          mapped.length ||
          0
        );
      }
    } catch (err) {
      console.error(
        'Failed to fetch orders',
        err
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    statusFilter,
    paymentFilter,
    search,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const updateOrderStatus = async (
    orderNumber: string,
    newStatus: string
  ) => {
    setUpdatingStatus(orderNumber);

    try {
      const res = await fetch(
        `/api/orders/${orderNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_status: newStatus,
          }),
        }
      );

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_number === orderNumber
              ? {
                ...o,
                order_status: newStatus,
              }
              : o
          )
        );

        if (
          selectedOrder?.order_number ===
          orderNumber
        ) {
          setSelectedOrder((prev) =>
            prev
              ? {
                ...prev,
                order_status: newStatus,
              }
              : null
          );
        }
      }
    } catch (err) {
      console.error(
        'Failed to update order status',
        err
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // =========================================================
  // UPDATE PAYMENT STATUS
  // =========================================================

  const updatePaymentStatus = async (
    orderNumber: string,
    newStatus: string
  ) => {
    setUpdatingPayment(orderNumber);

    try {
      const res = await fetch(
        `/api/orders/${orderNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_status: newStatus,
          }),
        }
      );

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_number === orderNumber
              ? {
                ...o,
                payment_status: newStatus,
              }
              : o
          )
        );

        if (
          selectedOrder?.order_number ===
          orderNumber
        ) {
          setSelectedOrder((prev) =>
            prev
              ? {
                ...prev,
                payment_status: newStatus,
              }
              : null
          );
        }
      }
    } catch (err) {
      console.error(
        'Failed to update payment status',
        err
      );
    } finally {
      setUpdatingPayment(null);
    }
  };

  const recordRefundAmount = async (orderNumber: string) => {
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount < (selectedOrder?.refunded_amount || 0)) {
      window.alert('Refund amount must be valid and cannot be lower than the amount already recorded.');
      return;
    }
    if (!window.confirm(`Confirm that a cumulative merchandise refund of ${formatCurrency(amount)} has been paid to the customer?`)) return;
    setSavingRefund(true);
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refunded_amount: amount }),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.message || 'Could not record refund.');
        return;
      }
      setOrders((previous) => previous.map((order) => order.order_number === orderNumber ? { ...order, ...result.data } : order));
      setSelectedOrder(result.data);
    } catch (error) {
      console.error('Failed to record order refund', error);
      window.alert('Could not record refund.');
    } finally {
      setSavingRefund(false);
    }
  };

  // =========================================================
  // DELETE ORDER
  // =========================================================

  const deleteOrder = async (
    orderNumber: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/orders/${orderNumber}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          error.message ||
          'Failed to delete order'
        );
      }

      setOrders((prev) =>
        prev.filter(
          (order) =>
            order.order_number !== orderNumber
        )
      );

      setTotal((prev) =>
        Math.max(0, prev - 1)
      );

      if (
        selectedOrder?.order_number ===
        orderNumber
      ) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error(
        'Failed to delete order',
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete order'
      );
    }
  };

  // =========================================================
  // CHECK WHETHER SEPARATE BILLING EXISTS
  // =========================================================

  const hasSeparateBilling = (
    order: Order
  ) => {
    // If billing is explicitly same as shipping,
    // don't show a separate billing section.
    if (order.billing_same_as_shipping === true) {
      return false;
    }

    // Show billing only when at least one
    // actual billing field contains data.
    return Boolean(
      order.billing_name?.trim() ||
      order.billing_phone?.trim() ||
      order.billing_email?.trim() ||
      order.billing_address?.trim() ||
      order.billing_city?.trim() ||
      order.billing_zone?.trim()
    );
  };

  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',

      render: (
        row: Record<string, unknown>
      ) => (
        <button
          onClick={() =>
            setSelectedOrder(
              row as unknown as Order
            )
          }
          className="font-medium text-green-600 hover:text-green-700"
        >
          {row.order_number as string}
        </button>
      ),
    },

    {
      key: 'customer_name',
      label: 'Customer',
    },

    {
      key: 'seller_name',
      label: 'Seller',
      render: (row: Record<string, unknown>) => {
        const sellerName = row.seller_name as string | undefined;
        if (!sellerName) return <span className="text-gray-400">—</span>;
        return (
          <span className="text-xs text-gray-700">
            {sellerName}
            {row.seller_order ? <span className="ml-1 text-[10px] text-gray-500">placed order</span> : null}
          </span>
        );
      },
    },

    {
      key: 'items',
      label: 'Items',

      render: (
        row: Record<string, unknown>
      ) =>
        (row.items as OrderItem[])
          ?.length || 0,
    },

    {
      key: 'total',
      label: 'Total',

      render: (
        row: Record<string, unknown>
      ) =>
        <div>
          <span>{formatCurrency(row.total as number)}</span>
          {row.seller_order && <p className="text-[10px] text-gray-500">COD to collect</p>}
        </div>,
    },

    {
      key: 'payment_status',
      label: 'Payment',

      render: (
        row: Record<string, unknown>
      ) => {
        const ps =
          row.payment_status as string;

        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              getPaymentStatusColor(ps)
            )}
          >
            {ps.charAt(0).toUpperCase() +
              ps.slice(1)}
          </span>
        );
      },
    },

    {
      key: 'payment_proof',
      label: 'Screenshot',

      render: (
        row: Record<string, unknown>
      ) => {
        const paymentProof =
          row.payment_proof as string | undefined;

        if (!paymentProof) {
          return (
            <span className="text-xs text-gray-400">
              —
            </span>
          );
        }

        return (
          <button
            type="button"
            onClick={() =>
              setPaymentScreenshot(paymentProof)
            }
            className="group relative"
            title="View payment screenshot"
          >
            <img
              src={paymentProof}
              alt="Payment screenshot"
              className="h-10 w-14 rounded border border-gray-200 object-cover transition group-hover:opacity-80"
            />

            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 transition group-hover:bg-black/30">
              <Eye className="h-4 w-4 text-transparent transition group-hover:text-white" />
            </div>
          </button>
        );
      },
    },

    {
      key: 'order_status',
      label: 'Status',

      render: (
        row: Record<string, unknown>
      ) => (
        <OrderStatusBadge
          status={
            row.order_status as string
          }
        />
      ),
    },

    {
      key: 'created_at',
      label: 'Date',

      render: (
        row: Record<string, unknown>
      ) =>
        new Date(
          row.created_at as string
        ).toLocaleDateString(),
    },

    {
      key: 'shipping_label',
      label: 'Label',

      render: (
        row: Record<string, unknown>
      ) => (
        <a
          href={`/api/shipping-label/${row.order_number as string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-700"
          title="Download Shipping Label"
        >
          <Package className="h-4 w-4" />
        </a>
      ),
    },

    {
      key: 'actions',
      label: 'Actions',

      render: (
        row: Record<string, unknown>
      ) => {
        const orderNumber =
          row.order_number as string;

        return (
          <div className="flex items-center gap-3">

            {/* View */}
            <button
              type="button"
              onClick={() =>
                setSelectedOrder(
                  row as unknown as Order
                )
              }
              className="text-gray-400 hover:text-gray-600"
              title="View Order"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() =>
                deleteOrder(orderNumber)
              }
              className="text-red-500 hover:text-red-700"
              title="Delete Order"
            >
              <Trash2 className="h-4 w-4" />
            </button>

          </div>
        );
      },
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-4">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Orders
        </h1>

        <span className="text-xs text-gray-500">
          {total} total
        </span>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              Status
            </label>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem
                  value="all"
                  className="text-xs"
                >
                  All Statuses
                </SelectItem>

                {ORDER_STATUSES.map(
                  (s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-xs"
                    >
                      {s
                        .charAt(0)
                        .toUpperCase() +
                        s.slice(1)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Payment */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              Payment
            </label>

            <Select
              value={paymentFilter}
              onValueChange={(val) => {
                setPaymentFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem
                  value="all"
                  className="text-xs"
                >
                  All Payments
                </SelectItem>

                {PAYMENT_STATUSES.map(
                  (s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-xs"
                    >
                      {s
                        .charAt(0)
                        .toUpperCase() +
                        s.slice(1)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              Search
            </label>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

              <Input
                placeholder="Order # or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          </div>

          {/* From */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              From
            </label>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          {/* To */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              To
            </label>

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

        </CardContent>
      </Card>

      {/* =====================================================
          ORDERS TABLE
      ===================================================== */}

      <DataTable
        columns={columns}
        data={
          orders as unknown as Record<
            string,
            unknown
          >[]
        }
        loading={loading}
      />

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
      />

      {/* =====================================================
          ORDER DETAIL DIALOG
      ===================================================== */}

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) =>
          !open &&
          setSelectedOrder(null)
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-xs">

              {/* =================================================
                  CUSTOMER INFORMATION
              ================================================= */}

              <div>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Customer Information
                </h3>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <span className="text-gray-500">
                      Name
                    </span>

                    <p className="font-medium text-gray-900">
                      {selectedOrder.customer_name ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Phone
                    </span>

                    <p className="font-medium text-gray-900">
                      {selectedOrder.customer_phone ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Email
                    </span>

                    <p className="font-medium text-gray-900 break-all">
                      {selectedOrder.customer_email ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Date
                    </span>

                    <p className="font-medium text-gray-900">
                      {new Date(
                        selectedOrder.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  {selectedOrder.seller_name && (
                    <div>
                      <span className="text-gray-500">Seller</span>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.seller_name}
                        {selectedOrder.seller_order ? ' · placed order' : ' · referral'}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              <Separator />

              <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Merchandise refund</p>
                  <p className="text-[11px] text-gray-600">Cumulative amount excluding delivery: {formatCurrency(Math.max(0, selectedOrder.subtotal - selectedOrder.discount - (selectedOrder.bank_transfer_discount || 0)))}. Only confirm refunds already paid to the customer.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={selectedOrder.refunded_amount || 0}
                    max={Math.max(0, selectedOrder.subtotal - selectedOrder.discount - (selectedOrder.bank_transfer_discount || 0))}
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    disabled={selectedOrder.payment_status !== 'paid' || savingRefund}
                    className="h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-xs"
                    aria-label="Cumulative merchandise refund amount"
                  />
                  <button
                    type="button"
                    onClick={() => void recordRefundAmount(selectedOrder.order_number)}
                    disabled={selectedOrder.payment_status !== 'paid' || savingRefund}
                    className="rounded-md bg-orange-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {savingRefund ? 'Saving…' : 'Record refund'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-600">Recorded so far: {formatCurrency(selectedOrder.refunded_amount || 0)}. Partial refunds reduce unpaid seller earnings proportionally; full refunds reverse them.</p>
              </div>

              <Separator />

              {/* =================================================
                  ADDRESS INFORMATION
              ================================================= */}

              <div>

                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />

                  <h3 className="font-semibold text-gray-900">
                    Address Information
                  </h3>
                </div>

                <div
                  className={cn(
                    'grid grid-cols-1 gap-3',
                    hasSeparateBilling(
                      selectedOrder
                    )
                      ? 'md:grid-cols-2'
                      : 'md:grid-cols-1'
                  )}
                >

                  {/* =============================================
                      SHIPPING ADDRESS
                  ============================================= */}

                  <div className="rounded border bg-gray-50 p-3">

                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        Shipping Address
                      </span>

                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Delivery
                      </span>
                    </div>

                    <div className="space-y-2">

                      <div>
                        <span className="text-gray-500">
                          Name
                        </span>

                        <p className="font-medium text-gray-900">
                          {selectedOrder.customer_name ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Phone
                        </span>

                        <p className="font-medium text-gray-900">
                          {selectedOrder.customer_phone ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Email
                        </span>

                        <p className="font-medium text-gray-900 break-all">
                          {selectedOrder.customer_email ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Address
                        </span>

                        <p className="font-medium text-gray-900">
                          {selectedOrder.customer_address ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          City
                        </span>

                        <p className="font-medium text-gray-900">
                          {selectedOrder.customer_city ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Delivery Zone
                        </span>

                        <p className="font-medium text-gray-900">
                          {selectedOrder.delivery_zone ||
                            '—'}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* =============================================
                      BILLING ADDRESS
                      ONLY IF CUSTOMER PROVIDED DIFFERENT
                      BILLING INFORMATION
                  ============================================= */}

                  {hasSeparateBilling(
                    selectedOrder
                  ) && (
                      <div className="rounded border bg-gray-50 p-3">

                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            Billing Address
                          </span>

                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            Different
                          </span>
                        </div>

                        <div className="space-y-2">

                          <div>
                            <span className="text-gray-500">
                              Name
                            </span>

                            <p className="font-medium text-gray-900">
                              {selectedOrder.billing_name ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Phone
                            </span>

                            <p className="font-medium text-gray-900">
                              {selectedOrder.billing_phone ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Email
                            </span>

                            <p className="font-medium text-gray-900 break-all">
                              {selectedOrder.billing_email ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Address
                            </span>

                            <p className="font-medium text-gray-900">
                              {selectedOrder.billing_address ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              City
                            </span>

                            <p className="font-medium text-gray-900">
                              {selectedOrder.billing_city ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Billing Zone
                            </span>

                            <p className="font-medium text-gray-900">
                              {selectedOrder.billing_zone ||
                                '—'}
                            </p>
                          </div>

                        </div>
                      </div>
                    )}

                </div>
              </div>

              <Separator />

              {/* =================================================
                  ITEMS
              ================================================= */}

              <div>

                <span className="text-gray-500">
                  Items
                </span>

                <div className="mt-2 space-y-2">

                  {selectedOrder.items.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded border p-2"
                      >

                        <div className="flex items-center gap-2">

                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}

                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>

                            {item.variant && (
                              <p className="text-gray-400">
                                {item.variant}
                              </p>
                            )}
                            {item.variantSelections?.length ? (
                              <p className="text-gray-400">
                                {item.variantSelections.map((variant) => `${variant.label}: ${variant.value}`).join(' · ')}
                              </p>
                            ) : null}
                            {selectedOrder.seller_order && item.originalUnitPrice !== undefined && (
                              <p className="mt-1 text-[10px] text-gray-500">
                                Veeo: {formatCurrency(item.originalUnitPrice)} · Customer: {formatCurrency(item.sellerSellingPrice ?? item.unitPrice)} · Seller profit: {formatCurrency((item.sellerProfit || 0) * item.qty)}
                              </p>
                            )}
                          </div>

                        </div>

                        <div className="text-right">

                          <p className="text-gray-900">
                            {item.qty} x{' '}
                            {formatCurrency(
                              item.unitPrice
                            )}
                          </p>

                          <p className="font-medium text-gray-900">
                            {formatCurrency(
                              item.qty *
                              item.unitPrice
                            )}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              </div>

              <Separator />

              {/* =================================================
                  PAYMENT INFORMATION
              ================================================= */}

              <div>

                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />

                  <h3 className="font-semibold text-gray-900">
                    Payment Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <span className="text-gray-500">
                      Payment Method
                    </span>

                    <p className="font-medium text-gray-900">
                      {selectedOrder.payment_method
                        ? selectedOrder.payment_method
                          .charAt(0)
                          .toUpperCase() +
                        selectedOrder.payment_method.slice(
                          1
                        )
                        : '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Payment Status
                    </span>

                    <p className="font-medium text-gray-900">
                      {selectedOrder.payment_status
                        ? selectedOrder.payment_status
                          .charAt(0)
                          .toUpperCase() +
                        selectedOrder.payment_status.slice(
                          1
                        )
                        : '—'}
                    </p>
                  </div>

                </div>
              </div>

              <Separator />

              {/* =================================================
                  TOTALS
              ================================================= */}

              <div className="space-y-1">

                {selectedOrder.seller_order && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Veeo product-price subtotal</span>
                      <span>
                        {formatCurrency(selectedOrder.items.reduce(
                          (sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.qty,
                          0
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seller profit snapshot (before delivery)</span>
                      <span>
                        {formatCurrency(selectedOrder.items.reduce(
                          (sum, item) => sum + (item.sellerProfit || 0) * item.qty,
                          0
                        ))}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span>
                    {formatCurrency(
                      selectedOrder.subtotal
                    )}
                  </span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">

                    <span>
                      Discount
                    </span>

                    <span>
                      -
                      {formatCurrency(
                        selectedOrder.discount
                      )}
                    </span>

                  </div>
                )}

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Delivery Fee
                  </span>

                  <span>
                    {formatCurrency(
                      selectedOrder.delivery_fee
                    )}
                  </span>

                </div>

                <Separator />

                <div className="flex justify-between font-semibold">

                  <span>
                    {selectedOrder.payment_method === 'cod' ? 'COD amount to collect' : 'Total'}
                  </span>

                  <span>
                    {formatCurrency(
                      selectedOrder.total
                    )}
                  </span>

                </div>

              </div>

              <Separator />

              {/* =================================================
                  STATUS CONTROLS
              ================================================= */}

              <div className="flex gap-4">

                {/* Order Status */}
                <div className="flex-1 space-y-1">

                  <span className="text-gray-500">
                    Order Status
                  </span>

                  <Select
                    value={
                      selectedOrder.order_status
                    }
                    onValueChange={(val) =>
                      updateOrderStatus(
                        selectedOrder.order_number,
                        val
                      )
                    }
                    disabled={
                      updatingStatus ===
                      selectedOrder.order_number
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      {ORDER_STATUSES.map(
                        (s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-xs"
                          >
                            {s
                              .charAt(0)
                              .toUpperCase() +
                              s.slice(1)}
                          </SelectItem>
                        )
                      )}

                    </SelectContent>
                  </Select>

                </div>

                {/* Payment Status */}
                <div className="flex-1 space-y-1">

                  <span className="text-gray-500">
                    Payment Status
                  </span>

                  <Select
                    value={
                      selectedOrder.payment_status
                    }
                    onValueChange={(val) =>
                      updatePaymentStatus(
                        selectedOrder.order_number,
                        val
                      )
                    }
                    disabled={
                      updatingPayment ===
                      selectedOrder.order_number
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      {PAYMENT_STATUSES.map(
                        (s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-xs"
                          >
                            {s
                              .charAt(0)
                              .toUpperCase() +
                              s.slice(1)}
                          </SelectItem>
                        )
                      )}

                    </SelectContent>
                  </Select>

                </div>

              </div>

              {/* =================================================
                  NOTES
              ================================================= */}

              {selectedOrder.notes && (
                <>
                  <Separator />

                  <div>

                    <span className="text-gray-500">
                      Notes
                    </span>

                    <p className="text-gray-900">
                      {selectedOrder.notes}
                    </p>

                  </div>
                </>
              )}

            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* =====================================================
    PAYMENT SCREENSHOT DIALOG
===================================================== */}

      <Dialog
        open={!!paymentScreenshot}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentScreenshot(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Payment Screenshot
            </DialogTitle>
          </DialogHeader>

          {paymentScreenshot && (
            <div className="flex max-h-[82vh] items-center justify-center overflow-auto rounded-lg bg-gray-100">
              <img
                src={paymentScreenshot}
                alt="Full payment screenshot"
                className="max-h-[78vh] max-w-full rounded object-contain shadow-sm"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}