// src/components/Expenses/ExpenseForm.jsx
import React, { useState } from 'react';
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
    MenuItem
} from '@mui/material';
import { expensesApi } from '../../api';

const ExpenseForm = ({ expense = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        category: expense?.category || '',
        description: expense?.description || '',
        amount: expense?.amount || 0,
        date: expense?.date || new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const categories = [
        'إيجار',
        'رواتب',
        'كهرباء',
        'ماء',
        'إنترنت',
        'مواصلات',
        'تسويق',
        'صيانة',
        'أخرى'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = {
                ...formData,
                amount: parseFloat(formData.amount) || 0
            };

            if (expense) {
                await expensesApi.update(expense.id, data);
            } else {
                await expensesApi.create(data);
            }
            onSuccess();
        } catch (err) {
            const errorMessage = err.response?.data?.errors || 
                                 err.response?.data?.message || 
                                 'حدث خطأ في حفظ المصروف';
            setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>الفئة *</InputLabel>
                        <Select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            label="الفئة *"
                            required
                        >
                            <MenuItem value="">اختر الفئة</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="الوصف"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={2}
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="المبلغ *"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="التاريخ *"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
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
                    {loading ? <CircularProgress size={24} /> : (expense ? 'تحديث' : 'إضافة')}
                </Button>
            </Box>
        </Box>
    );
};

export default ExpenseForm;