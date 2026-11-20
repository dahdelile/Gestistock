// src/components/Invoices/InvoiceList.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    CircularProgress,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Typography
} from '@mui/material';
import { Add, Visibility, Edit, Delete, Search, Refresh, Print } from '@mui/icons-material';
import { invoicesApi } from '../../api';
import InvoiceForm from './InvoiceForm';
import InvoiceDetails from './InvoiceDetails';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [openForm, setOpenForm] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [page, search, statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                per_page: 10,
                search: search || undefined,
                status: statusFilter || undefined
            };
            const response = await invoicesApi.getAll(params);
            const data = response.data.data;
            setInvoices(data.data);
            setTotalPages(data.last_page);
            setTotalItems(data.total);
        } catch (err) {
            setError('حدث خطأ في تحميل الفواتير');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (invoice) => {
        setSelectedInvoice(invoice);
        setOpenDetails(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            try {
                await invoicesApi.delete(id);
                await fetchInvoices();
            } catch (err) {
                setError('حدث خطأ في حذف الفاتورة');
            }
        }
    };

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
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">الفواتير</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenForm(true)}
                >
                    فاتورة جديدة
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
                <TextField
                    size="small"
                    placeholder="بحث عن فاتورة..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        endAdornment: <Search />
                    }}
                    sx={{ minWidth: 250 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>الحالة</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="الحالة"
                    >
                        <MenuItem value="">الكل</MenuItem>
                        <MenuItem value="paid">مدفوعة</MenuItem>
                        <MenuItem value="partial">مدفوعة جزئياً</MenuItem>
                        <MenuItem value="draft">مسودة</MenuItem>
                        <MenuItem value="cancelled">ملغية</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => {
                        setSearch('');
                        setStatusFilter('');
                        setPage(1);
                        fetchInvoices();
                    }}
                >
                    إعادة تعيين
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>رقم الفاتورة</TableCell>
                            <TableCell>العميل</TableCell>
                            <TableCell align="right">المجموع</TableCell>
                            <TableCell align="right">المدفوع</TableCell>
                            <TableCell align="right">المتبقي</TableCell>
                            <TableCell align="center">الحالة</TableCell>
                            <TableCell>التاريخ</TableCell>
                            <TableCell align="center">الإجراءات</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">لا يوجد فواتير</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {invoice.invoice_number}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{invoice.customer?.name || 'غير محدد'}</TableCell>
                                    <TableCell align="right">{invoice.grand_total} د.ل</TableCell>
                                    <TableCell align="right">{invoice.paid_amount} د.ل</TableCell>
                                    <TableCell align="right">{invoice.balance} د.ل</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={getStatusText(invoice.status)}
                                            color={getStatusColor(invoice.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="عرض">
                                            <IconButton size="small" color="info" onClick={() => handleView(invoice)}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="طباعة">
                                            <IconButton size="small" color="primary">
                                                <Print />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="حذف">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(invoice.id)}>
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography variant="body2" color="textSecondary">
                    عرض {invoices.length} من {totalItems}
                </Typography>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                />
            </Box>

            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
                <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
                <DialogContent>
                    <InvoiceForm
                        onSuccess={() => {
                            setOpenForm(false);
                            fetchInvoices();
                        }}
                        onCancel={() => setOpenForm(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="lg" fullWidth>
                <DialogTitle>تفاصيل الفاتورة</DialogTitle>
                <DialogContent>
                    <InvoiceDetails
                        invoice={selectedInvoice}
                        onClose={() => setOpenDetails(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default InvoiceList;