import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Typography,
  Divider,
  Select,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  Snackbar
} from "@mui/material";
import { Check, Error } from "@mui/icons-material";
import api from "./api";
import { socket } from './socket';

const BetPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [highestBet, setHighestBet] = useState(null);
  const [username, setUsername] = useState("");
  const [betAmount, setBetAmount] = useState(50);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", severity: "", icon: ""});
  // const [dbUpdate, setDbUpdate] = useState(null);

  const handleAlertClose = () => {
    setIsAlertOpen(false);
  };

  useEffect(() => {
    // Connect to the socket server
    console.log(`Connecting to server ... `)
    socket.connect();
    
    // Listen for 'db_update' events
    socket.on('db_update', (data) => {
      const paresed_data = data
      
      if (paresed_data.product_name === selectedProduct) { 
        setHighestBet(paresed_data); 
      }
      
      // console.log(`DBUpdate data: ${dbUpdate}`)
      // Handle the update (e.g., refresh product list or update UI)
    });

    // Cleanup on component unmount
    return () => {
      socket.off('db_update');
      socket.disconnect();
    };
  }, [selectedProduct]);

  // Fetch initial product list from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/product-list");
        const data = response.data;
        setProducts(data); // Assuming data is an object with products as keys
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch the highest bet for the selected product
  useEffect(() => {
    if (!selectedProduct) {
      setHighestBet(null);
      return;
    }

    const fetchHighestBet = async () => {
      try {
        const response = await api.get(`/highest-bet?product_name=${selectedProduct}`);
        setHighestBet(response.data);
      } catch (error) {
        console.error("Error fetching highest bet:", error);
        setHighestBet(null); // Clear highest bet if an error occurs
      }
    };

    fetchHighestBet();
  }, [selectedProduct]);

  // Handle placing a new bet
  const handlePlaceBet = async () => {
    if (!selectedProduct || !username || betAmount <= 0) {
      setAlertData({
        message: "Please fill in all fields to place your bet.",
        severity: "error",
        icon: <Error />
      });
      setIsAlertOpen(true);
      return;
    }

    try {
      const betData = {
        username,
        product_name: selectedProduct,
        price: betAmount,
      };

      const response = await api.post("/place-bet", betData);
      if (response.status === 201) {
        setAlertData({
          message: "Bet placed successfully!",
          severity: "success",
          icon: <Check />
        });
        setIsAlertOpen(true);
        setBetAmount(50); // Reset the bet amount
        setUsername(""); // Reset username

        // Refresh highest bet
        const refreshedHighestBet = await api.get(`/highest-bet?product_name=${selectedProduct}`);

        setHighestBet(refreshedHighestBet.data);
      } else {
        setAlertData({
          message: "Failed to place bet. Try again.",
          severity: "error",
          icon: <Error />
        });
        setIsAlertOpen(true);
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      setAlertData({
        message: "An error occurred. Please try again.",
        severity: "error",
        icon: <Error />
      });
      setIsAlertOpen(true);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bet on Your Favorite Product
      </Typography>

      <Divider sx={{ mb: 4 }} />

      {/* Product Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Choose a product to bet on:
        </Typography>
        <Select
          value={selectedProduct || ""}
          onChange={(e) => setSelectedProduct(e.target.value)}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {products.map((product, index) => (
            <MenuItem key={index} value={product}>
              {product}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Current Highest Bet Display */}
      {selectedProduct && highestBet && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              💰 Current Highest Bet
            </Typography>
            <Typography align="center">
              <strong>Product:</strong> {selectedProduct}
            </Typography>
            <Typography align="center">
              <strong>User:</strong> {highestBet.user || "N/A"}
            </Typography>
            <Typography align="center">
              <strong>Bet Amount:</strong> ₹{highestBet.amount || 0}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Place New Bet Form */}
      <Typography variant="h6" gutterBottom>
        Place Your Bet
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}

        />
        <TextField
          label="Bet Amount (₹)"
          type="number"
          variant="outlined"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          
        />
        <Button variant="contained" color="primary" onClick={handlePlaceBet}>
          Place Bet
        </Button>
      </Box>
      
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isAlertOpen}
        autoHideDuration={4000}
        onClose={handleAlertClose}
      >
        <Alert
          icon= {alertData.icon}
          onClose={handleAlertClose}
          severity={alertData.severity}
          sx={{ width: "100%" }}
        >
          {alertData.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default BetPage;
