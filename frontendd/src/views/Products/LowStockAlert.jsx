// src/components/Products/LowStockAlert.jsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Alert,
    Button,
    CircularProgress
} from '@mui/material';
import { Warning, ShoppingCart } from '@mui/icons-material';
import { productsApi } from '../../api'; // ✅ المسار الصحيح
import { useNavigate } from 'react-router-dom';

const LowStockAlert = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLowStockProducts();
    }, []);

    const fetchLowStockProducts = async () => {
        setLoading(true);
        try {
            const response = await productsApi.getLowStock();
            setProducts(response.data.data || []);
        } catch (err) {
            setError('حدث خطأ في تحميل المنتجات منخفضة المخزون');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                        <CircularProgress size={30} />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                </CardContent>
            </Card>
        );
    }

    if (products.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Warning sx={{ color: '#2e7d32' }} />
                        <Typography>جميع المنتجات متوفرة بالمخزون</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ border: '1px solid #ff1744', backgroundColor: '#fff5f5' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Warning sx={{ color: '#ff1744' }} />
                        <Typography variant="h6" color="error">
                            تنبيه: منتجات منخفضة المخزون
                        </Typography>
                        <Chip 
                            label={`${products.length} منتج`} 
                            color="error" 
                            size="small" 
                        />
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/products')}
                        startIcon={<ShoppingCart />}
                    >
                        عرض الكل
                    </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>المنتج</TableCell>
                                <TableCell align="center">الكمية</TableCell>
                                <TableCell align="center">الحد الأدنى</TableCell>
                                <TableCell align="center">الحالة</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.slice(0, 5).map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={product.quantity} 
                                            color="error" 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="center">{product.min_quantity}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label="مخزون منخفض"
                                            color="error"
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length > 5 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography color="textSecondary">
                                            ... و {products.length - 5} منتج آخر
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default LowStockAlert;