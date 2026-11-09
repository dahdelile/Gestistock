// src/components/Invoices/InvoiceDetails.jsx
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Divider
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';

const InvoiceDetails = ({ invoice, onClose }) => {
    if (!invoice) return null;

    const getStatusColor = (status) => {
        const colors = {
            paid: 'success',
            partial: 'warning',
            draft: 'default',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            paid: 'مدفوعة',
            partial: 'مدفوعة جزئياً',
            draft: 'مسودة',
            cancelled: 'ملغية'
        };
        return texts[status] || status;
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button startIcon={<ArrowBack />} onClick={onClose}>
                        رجوع
                    </Button>
                    <Typography variant="h6">
                        {invoice.invoice_number}
                    </Typography>
                    <Chip
                        label={getStatusText(invoice.status)}
                        color={getStatusColor(invoice.status)}
                    />
                </Box>
                <Button variant="contained" startIcon={<Print />}>
                    طباعة
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            معلومات العميل
                        </Typography>
                        <Typography variant="h6">
                            {invoice.customer?.name || 'غير محدد'}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.customer?.phone}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.customer?.address}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            معلومات الفاتورة
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    التاريخ
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    المستخدم
                                </Typography>
                                <Typography variant="body1">
                                    {invoice.user?.name || 'غير محدد'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>المنتج</TableCell>
                                    <TableCell align="center">الكمية</TableCell>
                                    <TableCell align="center">سعر الوحدة</TableCell>
                                    <TableCell align="right">الإجمالي</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoice.items?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.product?.name}</TableCell>
                                        <TableCell align="center">{item.quantity}</TableCell>
                                        <TableCell align="center">{item.unit_price} د.ل</TableCell>
                                        <TableCell align="right">{item.total} د.ل</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Grid container spacing={2} justifyContent="flex-end">
                            <Grid item xs={12} sm={6} md={4}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">
                                        المجموع الفرعي
                                    </Typography>
                                    <Typography variant="body1">
                                        {invoice.total} د.ل
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">
                                        الخصم
                                    </Typography>
                                    <Typography variant="body1" color="error">
                                        -{invoice.discount} د.ل
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">
                                        الضريبة
                                    </Typography>
                                    <Typography variant="body1">
                                        +{invoice.tax} د.ل
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        الإجمالي النهائي
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {invoice.grand_total} د.ل
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">
                                        المدفوع
                                    </Typography>
                                    <Typography variant="body1" color="success.main">
                                        {invoice.paid_amount} د.ل
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">
                                        المتبقي
                                    </Typography>
                                    <Typography variant="body1" color={invoice.balance > 0 ? 'error' : 'success.main'}>
                                        {invoice.balance} د.ل
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {invoice.notes && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                ملاحظات
                            </Typography>
                            <Typography variant="body2">
                                {invoice.notes}
                            </Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default InvoiceDetails;