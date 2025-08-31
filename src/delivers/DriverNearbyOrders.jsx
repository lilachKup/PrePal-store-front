import React, { useState, useEffect } from "react";
import { Delivery, DeliveryPerson } from "@/entities/all";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    MapPin,
    RefreshCw,
    Filter,
    TrendingUp,
    Clock,
    Navigation
} from "lucide-react";

import DeliveryCard from "../components/delivery/DeliveryCard";
import LocationTracker from "../components/delivery/LocationTracker";
import DeliveryMap from "../components/delivery/DeliveryMap";

// Calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export default function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [deliveryPerson, setDeliveryPerson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [filterPriority, setFilterPriority] = useState("all");
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUserAndData();
    }, []);

    const loadUserAndData = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            await loadDeliveryPersonData();
            await loadDeliveries();
        } catch (error) {
            console.error("Error loading user data:", error);
        }
        setIsLoading(false);
    };

    const loadDeliveryPersonData = async () => {
        try {
            const deliveryPersons = await DeliveryPerson.filter({ created_by: user?.email || "" });
            if (deliveryPersons.length > 0) {
                setDeliveryPerson(deliveryPersons[0]);
                setCurrentLocation({
                    lat: deliveryPersons[0].current_lat,
                    lng: deliveryPersons[0].current_lng
                });
            }
        } catch (error) {
            console.error("Error loading delivery person data:", error);
        }
    };

    const loadDeliveries = async () => {
        try {
            const availableDeliveries = await Delivery.filter({ status: "available" }, "-created_date");
            setDeliveries(availableDeliveries);
        } catch (error) {
            console.error("Error loading deliveries:", error);
        }
    };

    const handleLocationUpdate = async (location) => {
        setCurrentLocation(location);

        if (deliveryPerson) {
            await DeliveryPerson.update(deliveryPerson.id, {
                current_lat: location.lat,
                current_lng: location.lng
            });
        } else if (user) {
            // Create new delivery person record
            const newDeliveryPerson = await DeliveryPerson.create({
                current_lat: location.lat,
                current_lng: location.lng,
                phone: user.email, // Temporary - should be actual phone
                vehicle_type: "motorcycle"
            });
            setDeliveryPerson(newDeliveryPerson);
        }
    };

    const handleAcceptDelivery = async (delivery) => {
        if (!user) return;

        try {
            await Delivery.update(delivery.id, {
                status: "assigned",
                assigned_to: user.email
            });

            // Update delivery person's active deliveries
            if (deliveryPerson) {
                const activeDeliveries = deliveryPerson.active_deliveries || [];
                await DeliveryPerson.update(deliveryPerson.id, {
                    active_deliveries: [...activeDeliveries, delivery.id]
                });
            }

            loadDeliveries(); // Refresh the list
        } catch (error) {
            console.error("Error accepting delivery:", error);
        }
    };

    const getFilteredDeliveries = () => {
        let filtered = deliveries;

        if (filterPriority !== "all") {
            filtered = filtered.filter(d => d.priority === filterPriority);
        }

        // Filter by 15km radius if location is available
        if (currentLocation) {
            filtered = filtered.filter(delivery => {
                const distance = calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    delivery.pickup_lat,
                    delivery.pickup_lng
                );
                return distance <= 15;
            });
        }

        return filtered;
    };

    const getDeliveryDistance = (delivery) => {
        if (!currentLocation) return 0;
        return calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            delivery.pickup_lat,
            delivery.pickup_lng
        ).toFixed(1);
    };

    const filteredDeliveries = getFilteredDeliveries();
    const stats = {
        total: filteredDeliveries.length,
        high_priority: filteredDeliveries.filter(d => d.priority === "high" || d.priority === "urgent").length,
        potential_earnings: filteredDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0)
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">טוען נתונים...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-neutral-light min-h-screen">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-text-primary mb-2">הזמנות זמינות</h1>
                    <p className="text-text-secondary">משלוחים במרחק של עד 15 ק"מ ממך</p>
                </motion.div>

                <LocationTracker
                    onLocationUpdate={handleLocationUpdate}
                    currentLocation={currentLocation}
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">הזמנות זמינות</p>
                                        <p className="text-2xl font-bold text-primary-blue">{stats.total}</p>
                                    </div>
                                    <Package className="w-8 h-8 text-primary-blue" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">דחיפות גבוהה</p>
                                        <p className="text-2xl font-bold text-accent-orange">{stats.high_priority}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-accent-orange" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">רווח פוטנציאלי</p>
                                        <p className="text-2xl font-bold text-primary-green">₪{stats.potential_earnings}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-primary-green" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-white shadow-sm">
                        <TabsTrigger value="list" className="gap-2">
                            <Package className="w-4 h-4" />
                            רשימת הזמנות
                        </TabsTrigger>
                        <TabsTrigger value="map" className="gap-2">
                            <MapPin className="w-4 h-4" />
                            תצוגת מפה
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-6">
                        <div className="flex flex-wrap gap-4 items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">סינון לפי דחיפות:</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={filterPriority === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterPriority("all")}
                                    className={filterPriority === "all" ? "gradient-bg border-0 text-white" : ""}
                                >
                                    הכל
                                </Button>
                                <Button
                                    variant={filterPriority === "urgent" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterPriority("urgent")}
                                    className={filterPriority === "urgent" ? "bg-red-500 border-0 text-white" : ""}
                                >
                                    דחופה
                                </Button>
                                <Button
                                    variant={filterPriority === "high" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterPriority("high")}
                                    className={filterPriority === "high" ? "bg-orange-500 border-0 text-white" : ""}
                                >
                                    גבוהה
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <AnimatePresence>
                                {filteredDeliveries.length > 0 ? (
                                    filteredDeliveries.map((delivery, index) => (
                                        <motion.div
                                            key={delivery.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <DeliveryCard
                                                delivery={delivery}
                                                onAccept={handleAcceptDelivery}
                                                distance={getDeliveryDistance(delivery)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12"
                                    >
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-500 mb-2">
                                            אין הזמנות זמינות כרגע
                                        </h3>
                                        <p className="text-gray-400">
                                            {!currentLocation ? "אנא הפעל מעקב מיקום כדי לראות הזמנות באזור שלך" : "נסה להרחיב את הפילטרים או לחכות להזמנות חדשות"}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>

                    <TabsContent value="map" className="space-y-6">
                        <Card className="border-0 shadow-lg overflow-hidden">
                            <CardHeader className="bg-white">
                                <CardTitle className="flex items-center gap-2">
                                    <Navigation className="w-5 h-5" />
                                    מפת הזמנות באזור
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DeliveryMap
                                    deliveries={filteredDeliveries}
                                    currentLocation={currentLocation}
                                    selectedDelivery={selectedDelivery}
                                    onDeliverySelect={setSelectedDelivery}
                                />
                            </CardContent>
                        </Card>

                        {selectedDelivery && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <DeliveryCard
                                    delivery={selectedDelivery}
                                    onAccept={handleAcceptDelivery}
                                    distance={getDeliveryDistance(selectedDelivery)}
                                />
                            </motion.div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}