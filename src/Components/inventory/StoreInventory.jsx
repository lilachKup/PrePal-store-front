import React, {useState, useEffect} from "react";
import "./StoreInventory.css"; // Importing external CSS file
import categories from "./Categories"; // Importing categories from a separate file
//import "./CategoryPanel.css";
import axios from "axios";
import {useNavigate} from 'react-router-dom';


///in the future this will be replaced with the store id from the store info


const StoreInventory = ({storeId, storeName}) => {

    console.log("store id: ", storeId);
    console.log("store name: ", storeName);
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        id: "", name: "", category: "", price: "", quantity: "", description: "", brand: "", image: ""
    });
    const [error, setError] = useState("");
    const [editingProduct, setEditingProduct] = useState(null);
    const [categoryChoice, setCategoryChoice] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProductsBySearch, setFilteredProductsBySearch] = useState([]);
    const [isSearchOn, setIsSearchOn] = useState(false);


    useEffect(() => {
        if (storeId) {
            fetchProducts(storeId);

            //todo: get store name from the store id

        }

    }, [storeId]);

    /*useEffect(() => {
      console.log("Store user ID:", storeId);
      //todo: get store name from the store id
    }, [storeId]);*/

    const addProducts = async (productToAdd) => {
        try {
            const response = await axios.post('https://xgpbt0u4ql.execute-api.us-east-1.amazonaws.com/prod/products/add', productToAdd,);
            console.log("Response from Lambda:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error from Lambda:", error);
            throw error;
        }
    }

    const fetchProducts = async (storeId) => {
        if (!storeId) {
            console.warn("fetchProducts called with undefined storeId");
            return;
        }
        try {
            const response = await fetch(`https://xgpbt0u4ql.execute-api.us-east-1.amazonaws.com/prod/products/getAllPProducts/${storeId}`);
            const data = await response.json();
            console.log("API Response:", data);
            const productsArray = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];

            setProducts(productsArray);
        } catch (error) {
            console.error("Error fetching products:", error);
            setError("❌ Failed to fetch products.");
            setProducts([]); // fail-safe
        }
    };

    const editProductFromStore = async (storeId, product_id, description, price, quantity, image_url) => {
        try {

            const response = await fetch('https://xgpbt0u4ql.execute-api.us-east-1.amazonaws.com/prod/products/edit', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({store_id: storeId, product_id, description, price, quantity, image_url})
            });

            const data = await response.json();

            if (response.ok) {
                alert('Product updated successfully!');
                console.log('updated/deleted product:', data.product);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Something went wrong while deleting the product.');
        }
    };

    const deleteProductFromStore = async (storeId, product_id) => {
        try {

            const response = await fetch('https://xgpbt0u4ql.execute-api.us-east-1.amazonaws.com/prod/products/deleteFromStore', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({store_id: storeId, product_id})
            });

            const data = await response.json();

            if (response.ok) {
                //alert('Product deleted successfully!');
                console.log('Deleted product:', data.product);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Something went wrong while deleting the product.');
        }
    };

    const handleChange = (e) => {
        setNewProduct({...newProduct, [e.target.name]: e.target.value});
        setError(""); // Clear error message when typing
    };

    const addProduct = async () => {

        const missingFields = [];

        if (!newProduct.name) missingFields.push("Name");
        if (!newProduct.brand) missingFields.push("Brand");
        if (!newProduct.category) missingFields.push("Category");
        if (!newProduct.description) missingFields.push("Description");
        if (!newProduct.price || newProduct.price < 0) missingFields.push("Price");
        if (!newProduct.quantity || newProduct.quantity < 0) missingFields.push("Quantity");

        if (missingFields.length > 0) {
            const message = `⚠️ Error: Missing or invalid fields: ${missingFields.join(", ")}`;
            setError(message);
            return;
        }

        if (editingProduct !== null) {
            await editProductFromStore(storeId, editingProduct, newProduct.description, newProduct.price, newProduct.quantity, newProduct.image);

            //setProducts(products.map((product) =>
            //  product.id === editingProduct ? { ...newProduct, id: editingProduct } : product
            //));
            setEditingProduct(null);
            await fetchProducts(storeId);
        } else {
            const filteredList = products.filter(product => newProduct.name === product.name)
            if (filteredList.length !== 0) {
                setError("⚠️ Error: This product already exist!");
                alert("⚠️ Error: This product already exist!");
                return;
            }

            setProducts([...products, {...newProduct, id: Date.now()}]);
            console.log("new product: ", newProduct);
            console.log("all products: ", products);

            const productToAdd = {
                store_id: storeId,
                product_name: newProduct.name,
                category: newProduct.category,
                description: " ",
                price: Number(newProduct.price),
                quantity: Number(newProduct.quantity),
                image_url: "",
                brand: newProduct.brand
            }

            await addProducts(productToAdd);
            await fetchProducts(storeId);
        }

        setNewProduct({
            name: "", price: "", quantity: "", brand: "", description: "", image: "", category: categoryChoice
        }); // Clear form fields after submission
        setError(""); // Clear error after successful addition
        await fetchProducts(storeId);
        handleSearch();
    };

    const removeProduct = async (id) => {
        setProducts(products.filter((product) => product.id !== id));
        setEditingProduct(null); // Clear editing state if the removed product was being edited
        await deleteProductFromStore(storeId, id);
        await fetchProducts(storeId);
        if (isSearchOn) {
            handleSearch();
        }
    };

    const editProduct = async (product) => {
        setNewProduct({
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            brand: product.brand,
            description: product.description,
            category: product.category,
            image: product.image
        });
        setEditingProduct(product.id);
        /*await fetchProducts();
        if (isSearchOn) {
          handleSearch();
        }*/
    };

    const cleanForm = () => {
        setNewProduct({name: "", price: "", quantity: "", image: "", brand: "", description: "", category: ""});
        setEditingProduct(null);
        setError("");
    };

    const HandleCategoryClick = (e) => {
        setCategoryChoice(e);
        setNewProduct({...newProduct, category: e});

    }

    const handleNoneCategoryClick = () => {
        setCategoryChoice("");
        setNewProduct({...newProduct, category: ""});
    }

    const handleSearch = () => {
        setIsSearchOn(true);
        console.log("handle search.");
        console.log("search term: ", searchTerm);
        console.log("products: ", products);
        if (!searchTerm.trim()) {
            console.log("No search term provided.");
            return;
        }
        const filtered = products.filter((product) => product.name.toLowerCase().startsWith(searchTerm.toLowerCase()) && (!categoryChoice || product.category === categoryChoice));
        console.log(filtered);
        setFilteredProductsBySearch(filtered);
    };

    const handleClearSearch = () => {
        setIsSearchOn(false);
        setSearchTerm("");
        setFilteredProductsBySearch([]);
    };

    return (<div className="inventory-title">
            <button onClick={() => navigate('/orders', {state: {storeId, storeName}})} className="go-to-orders-button">
                Go to Orders
            </button>

            <h1 className="inventory-management-title">{storeName} Inventory Management</h1>
            <div className="row-container">
                <div className="inventory-container">
                    <h2 className="product-details-title">Enter Product Details</h2>
                    {error && <p className="error-message">{error}</p>}
                    <div className="inventory-form">
                        <input type="text" name="name" placeholder="Product Name" value={newProduct.name}
                               onChange={handleChange} disabled={editingProduct !== null}/>
                        <input type="text" name="brand" placeholder="Product Brand" value={newProduct.brand}
                               onChange={handleChange}/>
                        <select name="category" value={newProduct.category} onChange={handleChange}>
                            <option value="">select category</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>))}
                        </select>
                        <input type="text" name="description" placeholder="Product Description"
                               value={newProduct.description} onChange={handleChange}/>
                        <input type="number" name="price" placeholder="Price" value={newProduct.price}
                               onChange={handleChange}/>
                        <input type="number" name="quantity" placeholder="Quantity" value={newProduct.quantity}
                               onChange={handleChange}/>
                        <input type="text" name="image" placeholder="Image URL" value={newProduct.image || ""}
                               onChange={handleChange}/>
                        <button onClick={addProduct}
                                className="add-product-btn">{editingProduct !== null ? "Update Product" : "Add Product"}</button>
                        {(editingProduct !== null || newProduct.name || parseFloat(newProduct.price) > 0 || parseFloat(newProduct.quantity) > 0 || newProduct.image) && (
                            <button onClick={cleanForm} className="cancel-btn">Clean Fields</button>)}
                    </div>
                </div>

                <div className="catogory-search-panel">
                    <div className="category-container">
                        <h2 className="category-title">Categories</h2>
                        <ul className="category-list">
                            {categories.map((category, index) => (<li key={index}>
                                    <button className={`category-item ${categoryChoice === category ? "active" : ""}`}
                                            onClick={() => {
                                                HandleCategoryClick(category)
                                            }}>{category}</button>
                                </li>))}
                        </ul>
                        {(categoryChoice) && (
                            <button className="cancel-choice" onClick={handleNoneCategoryClick}>None</button>)}
                    </div>

                    <div className="search-container">
                        <input type="text" placeholder="Search product name" value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
                        <div className="search-buttons">
                            <button onClick={handleSearch} className="search-btn">Search</button>
                            <button onClick={handleClearSearch} className="clear-btn">Clear</button>
                        </div>
                    </div>
                </div>

            </div>


            <ul className="product-list">
                {((filteredProductsBySearch && filteredProductsBySearch.length > 0 ? filteredProductsBySearch : products) || [])
                    .filter((product) => (!categoryChoice || product.category === categoryChoice))
                    .map((product) => (<li key={product.id} className="product-card">
                            <div className="product-image">
                                <img
                                    src={product.image || "https://img.icons8.com/ios-filled/50/ffffff/shopping-cart.png"}
                                    alt={product.name}/>
                            </div>
                            <div className="product-content">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-brand">{product.brand}</p>
                                <p className="product-meta">{product.price}₪ | {product.quantity} pcs</p>
                                <div className="product-actions">
                                    <button onClick={() => editProduct(product)} className="edit-btn">Edit</button>
                                    <button onClick={() => removeProduct(product.id)} className="remove-btn">Remove
                                    </button>
                                </div>
                            </div>
                        </li>))}
            </ul>
        </div>);
};

export default StoreInventory;
