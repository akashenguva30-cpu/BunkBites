import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    fetchOrders();
  }, []);
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      if (err.response?.status === 401) navigate('/');
    }
  };
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      padding: '20px'
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      },
      children: [/*#__PURE__*/_jsxDEV("h2", {
        children: "My Orders"
      }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
        onClick: () => navigate('/student'),
        children: "Back to Menu"
      }, void 0, false)]
    }, void 0, true), orders.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
      children: "No orders found."
    }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '20px'
      },
      children: Array.isArray(orders) && orders.map(order => /*#__PURE__*/_jsxDEV("div", {
        style: {
          border: '1px solid #ccc',
          padding: '15px',
          borderRadius: '8px'
        },
        children: [/*#__PURE__*/_jsxDEV("div", {
          style: {
            display: 'flex',
            justifyContent: 'space-between'
          },
          children: [/*#__PURE__*/_jsxDEV("h3", {
            children: ["Token: ", order.token?.tokenNumber || 'N/A']
          }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
            style: {
              padding: '5px 10px',
              backgroundColor: '#eee',
              borderRadius: '4px'
            },
            children: order.status || 'UNKNOWN'
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          children: [/*#__PURE__*/_jsxDEV("strong", {
            children: "Total:"
          }, void 0, false), " $", order.totalAmount]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          children: [/*#__PURE__*/_jsxDEV("strong", {
            children: "Payment:"
          }, void 0, false), " ", order.payment?.method || 'N/A', " (", order.payment?.status || 'N/A', ")"]
        }, void 0, true), /*#__PURE__*/_jsxDEV("hr", {}, void 0, false), /*#__PURE__*/_jsxDEV("h4", {
          children: "Items:"
        }, void 0, false), /*#__PURE__*/_jsxDEV("ul", {
          children: order.items && Array.isArray(order.items) ? order.items.map(item => /*#__PURE__*/_jsxDEV("li", {
            children: [item.menuItem?.name || 'Unknown Item', " - ", item.quantity, " x $", item.unitPrice, " = $", item.subtotal]
          }, item.id, true)) : /*#__PURE__*/_jsxDEV("li", {
            children: "No items found"
          }, void 0, false)
        }, void 0, false)]
      }, order.id, true))
    }, void 0, false)]
  }, void 0, true);
}
module.exports = OrderHistory;
