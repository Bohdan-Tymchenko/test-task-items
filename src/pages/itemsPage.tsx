import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../store/auth/authSlice";
import { getItemsThunk, deleteItemsThunk, updateItemThunk } from "../store/items/itemsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { Item, ItemPayload, ItemPriority, ItemStatus } from "../types";
import { Box, Button, Container, FormControl, MenuItem, Paper, Select, Table, TableCell, TableHead, TableRow, Typography, TableContainer, Checkbox, TableBody, Stack, TextField } from "@mui/material";

const STATUS_OPTIONS: ItemStatus[] = ['open', 'in_progress', 'done'];
const PRIORITY_OPTIONS: ItemPriority[] = [1, 2, 3, 4, 5];

export const ItemsPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    // selected items ids array (checkboxes)
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    // search value
    const [searchValue, setSearchValue] = useState<string>('');
    // item currently edited inline
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ItemPayload>({
        name: '',
        status: 'open',
        priority: 3,
    });
    // all items
    const { items: allItems, isLoading: isLoadingItems, error } = useAppSelector((state) => state.items);
    // filtered items
    const items = allItems.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()));

    const allItemsSelected = selectedItems.length === items.length;
    const partiallyItemsSelected = selectedItems.length > 0 && selectedItems.length < items.length;

    useEffect(() => {
        dispatch(getItemsThunk());
    }, [dispatch]);

    const handleSelectAll = () => {
        if (allItemsSelected) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map((item) => item.id));
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedItems([...selectedItems, id]);
    };

    const handleDeselectOne = (id: string) => {
        setSelectedItems(selectedItems.filter((item) => item !== id));
    };

    const handleDeleteSelectedItems = async () => {
        try {
            await dispatch(deleteItemsThunk(selectedItems)).unwrap();
            setSelectedItems([]);
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleEditItem = (item: Item) => {
        setEditingItemId(item.id);
        setEditForm({
            name: item.name,
            status: item.status,
            priority: item.priority,
        });
    };

    const handleSaveItem = async (id: string) => {
        try {
            await dispatch(updateItemThunk({ id, payload: editForm })).unwrap();
            setEditForm({
                name: '',
                status: 'open',
                priority: 3,
            });
            setEditingItemId(null);
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await dispatch(deleteItemsThunk([id])).unwrap();
            setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: '800' }}>Items</Typography>
                <Button variant="contained" color="error"
                    onClick={() => {
                        dispatch(logout());
                        navigate('/login');
                    }}
                >
                    Logout
                </Button>
            </Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField label="Search" variant="outlined" size="small" onChange={(e) => handleSearch(e.target.value)} />
                <Button variant="contained" color="primary" disabled={selectedItems.length === 0} onClick={handleDeleteSelectedItems}>
                    Delete Selected
                </Button>
            </Stack>
            <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
                {error && <Typography gutterBottom>Error: {error}</Typography>}
                {items.length ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={allItemsSelected}
                                            indeterminate={partiallyItemsSelected}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => {
                                    const isEditing = editingItemId === item.id;

                                    return (
                                        <TableRow key={item.id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={selectedItems.includes(item.id)} onChange={() => selectedItems.includes(item.id) ? handleDeselectOne(item.id) : handleSelectOne(item.id)} />
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                ) : (
                                                    item.name
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <FormControl size="small" fullWidth>
                                                        <Select
                                                            value={editForm.status}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    status: e.target.value as ItemStatus,
                                                                })
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <MenuItem key={status} value={status}>
                                                                    {status}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    item.status
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <FormControl size="small" fullWidth>
                                                        <Select
                                                            value={editForm.priority}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    priority: Number(e.target.value) as ItemPriority,
                                                                })
                                                            }
                                                        >
                                                            {PRIORITY_OPTIONS.map((priority) => (
                                                                <MenuItem key={priority} value={priority}>
                                                                    {priority}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    item.priority
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={editingItemId !== null && !isEditing}
                                                    onClick={() => isEditing ? handleSaveItem(item.id) : handleEditItem(item)}
                                                >
                                                    {isEditing ? 'Save' : 'Edit'}
                                                </Button>
                                                <Button variant="contained" color="primary" onClick={() => handleDeleteItem(item.id)}>
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : isLoadingItems ? <Typography gutterBottom>Loading...</Typography> : <Typography gutterBottom>No items found</Typography>}
            </Paper>
        </Container >
    );
};
