import React, {useEffect, useState} from "react";
import "./StoreOrder.css";
import {io} from "socket.io-client";
import {useNavigate} from "react-router-dom";
import {useLocation} from 'react-router-dom';


const StoreOrder = () => {
    const navigate = useNavigate();

    const location = useLocation();
    const {storeId, storeName} = location.state || {};

    console.log("storeId", storeId);
    console.log("storeName", storeName);

    const [orders, setOrders] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState({});


    useEffect(() => {
        let intervalId;

        const fetchOrders = async () => {
            try {
                const response = await fetch(`https://yv6baxe2i0.execute-api.us-east-1.amazonaws.com/dev/getAllOrdersFromStore/${storeId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                const data = await response.json();
                if (!data.orders) {
                    console.log("❌ No orders found");
                } else {
                    seperateOrders(data.orders);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        fetchOrders();

        intervalId = setInterval(fetchOrders, 5000);

        return () => clearInterval(intervalId);

    }, [storeId]);


    const seperateOrders = (allOrdersFromStore) => {
        const formattedOrders = allOrdersFromStore.map(order => ({
            id: order.order_num,
            clientName: order.customer_name,
            totalPrice: order.total_price,
            location: order.customer_Location,
            customerMail: order.customer_mail,
            street: "",
            status: "pending",
            products: order.items.map(item => {
                const [name, quantity] = item.split(":").map(s => s.trim());
                return {name, quantity: parseInt(quantity, 10)};
            })
        }));

        setOrders(formattedOrders);
    };


    const toggleExpand = (id) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleStatusChange = (order, status) => {
        if (status === "ready") {
            setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? {...order, status} : o))
            );
            //todo send mail to customer if order is ready
        }
        else {
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            //todo send mail to customer if order will not be ready
            //todo send delete order from store
        }
    };


    return (

        <div className="store-orders-wrapper">
            <button onClick={() => navigate('/inventory')} className="go-to-store-button">
                Go to Orders
            </button>
            <h2 className="store-title">{storeName} orders </h2>
            <div className="orders-container">
                {orders.length === 0 ? (
                    <p>no orders </p>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className={`order-card ${expandedOrders[order.id] ? "expanded" : ""}`}>
                            <h3>Order #{order.id}</h3>
                            <p>
                                <strong>Name:</strong> {order.clientName}
                            </p>
                            <p>
                                <strong>Price:</strong> ₪{order.totalPrice}
                            </p>
                            <p>
                                <strong>Location:</strong> {order.location}, {order.street}
                            </p>
                            <p>
                                <strong>Status:</strong> {order.status}
                            </p>
                            <p>
                                <strong>Email:</strong> {order.customerMail}
                            </p>

                            <button
                                className="toggle-button"
                                onClick={() => toggleExpand(order.id)}
                            >
                                {expandedOrders[order.id] ? "Hide Products" : "Show Products"}
                            </button>

                            {expandedOrders[order.id] && (
                                <div className="product-grid">
                                    {order.products.map((p, idx) => (
                                        <div key={idx} className="product-chip">
                                            <span className="product-name">{p.name}</span>
                                            <span className="product-qty">× {p.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                            )}

                            {order.status === "pending" && (
                                <div className="card-buttons">
                                    <button
                                        className="ready-btn"
                                        onClick={() => handleStatusChange(order, "ready")}
                                    >
                                        Mark as Ready
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleStatusChange(order, "rejected")}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StoreOrder;