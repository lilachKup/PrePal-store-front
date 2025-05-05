import React, { useEffect, useState } from "react";
import "./StoreOrder.css";
import { io } from "socket.io-client";
const storeId = "123";
const StoreOrder = () => {
    const [orders, setOrders] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState({});

    useEffect(() => {
        const socket = io("https://prepal-render.onrender.com"); // ← חיבור לשרת

        socket.on("connect", () => {
            console.log("🟢 Connected to socket:", socket.id);
            socket.emit("joinStoreRoom", `store-${storeId}`);
        });


        socket.on("newOrder", (order) => {
            console.log("📦 New order received:", order);
            setOrders(prev => [...prev, order]);
        });

        return () => {
            socket.disconnect(); // ← חשוב לנקות כשעוזבים את הקומפוננטה
        };
    }, []);

    const toggleExpand = (id) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleStatusChange = (order, status) => {
        if (status === "ready") {
            setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? { ...order, status } : o))
            );
        } else {
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
        }
    };


    /*const sendOrder = async () => {
        try {
            const response = await fetch("http://localhost:3001/sendOrder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

            });

            const newOrder = await response.json();
            setOrders(prev => [...prev, newOrder]); // ⬅️ מציג רק אם שלחת
        } catch (err) {
            console.error("❌ Failed to send order", err);
        }
    };*/


    return (
        <div className="store-orders-wrapper">
            <h2 className="store-title">shupersal online </h2>
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