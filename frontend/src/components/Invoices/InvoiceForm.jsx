// src/components/Invoices/InvoiceForm.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Divider,
    Autocomplete
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { invoicesApi, customersApi, productsApi } from '../../api';

const InvoiceForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        customer_id: '',
        items: [{ product_id: '', quantity: 1, unit_price: 0 }],
        discount: 0,
        tax: 0,
        paid_amount: 0,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [totals, setTotals] = useState({ total: 0, grandTotal: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [formData.items, formData.discount, formData.tax]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [customersRes, productsRes] = await Promise.all([
                customersApi.getAll({ per_page: 100 }),
                productsApi.getAll({ per_page: 100 })
            ]);
            setCustomers(customersRes.data.data.data || []);
            setProducts(productsRes.data.data.data || []);
        } catch (err) {
            setError('حدث خطأ في تحميل البيانات');
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };

    const calculateTotals = () => {
        let total = 0;
        formData.items.forEach(item => {
            total += (item.quantity || 0) * (item.unit_price || 0);
        });
        const discount = parseFloat(formData.discount) || 0;
        const tax = parseFloat(formData.tax) || 0;
        const grandTotal = total - discount + tax;
        setTotals({ total, grandTotal });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'product_id') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].unit_price = product.sale_price;
            }
        }
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                items: newItems
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = {
                ...formData,
                customer_id: parseInt(formData.customer_id),
                discount: parseFloat(formData.discount) || 0,
                tax: parseFloat(formData.tax) || 0,
                paid_amount: parseFloat(formData.paid_amount) || 0,
                items: formData.items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            await invoicesApi.create(data);
            onSuccess();
        } catch (err) {
            const errorMessage = err.response?.data?.errors || 
                                 err.response?.data?.message || 
                                 'حدث خطأ في إنشاء الفاتورة';
            setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>العميل *</InputLabel>
                        <Select
                            name="customer_id"
                            value={formData.customer_id}
                            onChange={handleChange}
                            label="العميل *"
                            required
                        >
                            <MenuItem value="">اختر عميل</MenuItem>
                            {customers.map((customer) => (
                                <MenuItem key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.phone}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        المنتجات
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>المنتج</TableCell>
                                    <TableCell align="center">الكمية</TableCell>
                                    <TableCell align="center">سعر الوحدة</TableCell>
                                    <TableCell align="right">الإجمالي</TableCell>
                                    <TableCell align="center"></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={item.product_id}
                                                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                                    required
                                                >
                                                    <MenuItem value="">اختر منتج</MenuItem>
                                                    {products.map((product) => (
                                                        <MenuItem key={product.id} value={product.id}>
                                                            {product.name} - {product.sale_price} د.ل
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                inputProps={{ min: 1 }}
                                                sx={{ width: 80 }}
                                                required
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                inputProps={{ min: 0, step: 0.01 }}
                                                sx={{ width: 100 }}
                                                required
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {(item.quantity * item.unit_price).toFixed(2)} د.ل
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => removeItem(index)}
                                                disabled={formData.items.length === 1}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button
                        startIcon={<Add />}
                        onClick={addItem}
                        sx={{ mt: 1 }}
                    >
                        إضافة منتج
                    </Button>
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="الخصم"
                        name="discount"
                        type="number"
                        value={formData.discount}
                        onChange={handleChange}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="الضريبة"
                        name="tax"
                        type="number"
                        value={formData.tax}
                        onChange={handleChange}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="المبلغ المدفوع"
                        name="paid_amount"
                        type="number"
                        value={formData.paid_amount}
                        onChange={handleChange}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="ملاحظات"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        multiline
                        rows={2}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    المجموع الفرعي
                                </Typography>
                                <Typography variant="h6">
                                    {totals.total.toFixed(2)} د.ل
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    الخصم
                                </Typography>
                                <Typography variant="h6" color="error">
                                    -{parseFloat(formData.discount || 0).toFixed(2)} د.ل
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    الإجمالي النهائي
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    {totals.grandTotal.toFixed(2)} د.ل
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={onCancel}>
                    إلغاء
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'إنشاء الفاتورة'}
                </Button>
            </Box>
        </Box>
    );
};

export default InvoiceForm;