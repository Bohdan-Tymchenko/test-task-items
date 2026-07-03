import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Checkbox,
    Container,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";

import { logout } from "../store/auth/authSlice";
import { getItemsThunk, deleteItemsThunk, updateItemThunk, createItemThunk, updateItemsThunk } from "../store/items/itemsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { CreateItemPayload, Item, ItemPriority, ItemStatus, UpdateItemPayload } from "../types";
import { getItemNameValidationError } from "../lib/itemValidation";

const STATUS_OPTIONS: ItemStatus[] = ['open', 'in_progress', 'done'];
const PRIORITY_OPTIONS: ItemPriority[] = [1, 2, 3, 4, 5];
type ItemForm = CreateItemPayload & UpdateItemPayload;

const INITIAL_ITEM_FORM: ItemForm = {
    name: '',
    status: 'open',
    priority: 3,
};

export const ItemsPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // selected items ids array (checkboxes)
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // search value
    const [searchValue, setSearchValue] = useState<string>('');

    // item currently edited inline
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ItemForm>(INITIAL_ITEM_FORM);
    const [nameError, setNameError] = useState('');

    // create new item form
    const [createNewItemForm, setCreateNewItemForm] = useState<ItemForm>(INITIAL_ITEM_FORM);
    const [createNewItemNameError, setCreateNewItemNameError] = useState('');

    // all items
    const {
        items: allItems,
        isLoading: isLoadingItems,
        isCreating,
        savingItemIds,
        error,
    } = useAppSelector((state) => state.items);

    // filtered items
    const items = allItems.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()));

    const visibleItemIds = items.map((item) => item.id);
    const selectedVisibleItemIds = visibleItemIds.filter((id) => selectedItems.includes(id));
    const allItemsSelected = visibleItemIds.length > 0 && selectedVisibleItemIds.length === visibleItemIds.length;
    const partiallyItemsSelected = selectedVisibleItemIds.length > 0 && selectedVisibleItemIds.length < visibleItemIds.length;
    const hasSelectedSavingItem = selectedVisibleItemIds.some((id) => savingItemIds.includes(id));

    useEffect(() => {
        dispatch(getItemsThunk());
    }, [dispatch]);

    const handleSelectAll = () => {
        if (allItemsSelected) {
            setSelectedItems(selectedItems.filter((id) => !visibleItemIds.includes(id)));
        } else {
            setSelectedItems([...new Set([...selectedItems, ...visibleItemIds])]);
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
            await dispatch(deleteItemsThunk(selectedVisibleItemIds)).unwrap();
            setSelectedItems(selectedItems.filter((id) => !selectedVisibleItemIds.includes(id)));
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleMarkSelectedDone = async () => {
        try {
            await dispatch(updateItemsThunk({ ids: selectedVisibleItemIds, payload: { status: 'done' } })).unwrap();
            setSelectedItems(selectedItems.filter((id) => !selectedVisibleItemIds.includes(id)));
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleEditItem = (item: Item) => {
        setEditingItemId(item.id);
        setNameError('');
        setEditForm({
            name: item.name,
            status: item.status,
            priority: item.priority,
        });
    };

    const handleSaveItem = async (id: string) => {
        const validationError = getItemNameValidationError(editForm.name);
        if (validationError) {
            setNameError(validationError);
            return;
        }

        try {
            await dispatch(updateItemThunk({ id, payload: { ...editForm, name: editForm.name.trim() } })).unwrap();
            setEditForm(INITIAL_ITEM_FORM);
            setNameError('');
            setEditingItemId(null);
        } catch {
            // The slice stores the displayable error.
        }
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setNameError('');
        setEditForm(INITIAL_ITEM_FORM);
    };

    const handleCreateNewItem = async () => {
        const validationError = getItemNameValidationError(createNewItemForm.name);

        if (validationError) {
            setCreateNewItemNameError(validationError);
            return;
        }

        try {
            await dispatch(createItemThunk({ ...createNewItemForm, name: createNewItemForm.name.trim() })).unwrap();
            setCreateNewItemForm(INITIAL_ITEM_FORM);
            setCreateNewItemNameError('');
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
        <Container maxWidth="lg">
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
            <Paper elevation={8} sx={{ p: 4, borderRadius: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                    <TextField
                        label="New Item"
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 260 }}
                        value={createNewItemForm.name}
                        error={Boolean(createNewItemNameError)}
                        helperText={createNewItemNameError}
                        onChange={(e) => {
                            const newName = e.target.value;
                            setCreateNewItemForm({ ...createNewItemForm, name: newName });
                            setCreateNewItemNameError(getItemNameValidationError(newName));
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={createNewItemForm.status}
                            inputProps={{ 'aria-label': 'New item status' }}
                            onChange={(e) => {
                                setCreateNewItemForm({
                                    ...createNewItemForm,
                                    status: e.target.value as ItemStatus,
                                });
                            }}
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select
                            value={createNewItemForm.priority}
                            inputProps={{ 'aria-label': 'New item priority' }}
                            onChange={(e) => {
                                setCreateNewItemForm({
                                    ...createNewItemForm,
                                    priority: Number(e.target.value) as ItemPriority,
                                });
                            }}
                        >
                            {PRIORITY_OPTIONS.map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {priority}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={isCreating || Boolean(getItemNameValidationError(createNewItemForm.name))}
                        onClick={handleCreateNewItem}
                        loading={isCreating}
                    >
                        Create
                    </Button>
                </Stack>
            </Paper>

            <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 2 }}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedVisibleItemIds.length === 0 || hasSelectedSavingItem}
                        onClick={handleMarkSelectedDone}
                    >
                        Mark Selected Done
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedVisibleItemIds.length === 0 || hasSelectedSavingItem}
                        onClick={handleDeleteSelectedItems}
                    >
                        Delete Selected
                    </Button>
                </Stack>
                {error && <Typography gutterBottom>Error: {error}</Typography>}
                {items.length ? (
                    <TableContainer>
                        <Table sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ width: 56 }}>
                                        <Checkbox
                                            checked={allItemsSelected}
                                            indeterminate={partiallyItemsSelected}
                                            slotProps={{ input: { 'aria-label': 'Select all visible items' } }}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ width: 300 }}>Name</TableCell>
                                    <TableCell sx={{ width: 220 }}>Status</TableCell>
                                    <TableCell sx={{ width: 160 }}>Priority</TableCell>
                                    <TableCell align="right" sx={{ width: 220 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => {
                                    const isEditing = editingItemId === item.id;
                                    const isRowSaving = savingItemIds.includes(item.id);
                                    const hasEditChanges = isEditing && (
                                        editForm.name.trim() !== item.name ||
                                        editForm.status !== item.status ||
                                        editForm.priority !== item.priority
                                    );
                                    const isSaveDisabled = isEditing && (
                                        !hasEditChanges ||
                                        Boolean(getItemNameValidationError(editForm.name))
                                    );

                                    return (
                                        <TableRow key={item.id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    disabled={isRowSaving}
                                                    slotProps={{ input: { 'aria-label': `Select ${item.name}` } }}
                                                    onChange={() => selectedItems.includes(item.id) ? handleDeselectOne(item.id) : handleSelectOne(item.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={editForm.name}
                                                        error={Boolean(nameError)}
                                                        helperText={nameError}
                                                        onChange={(e) => {
                                                            const newName = e.target.value;
                                                            setEditForm({ ...editForm, name: newName });
                                                            setNameError(getItemNameValidationError(newName));
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body1" component="span">{item.name}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <FormControl size="small" fullWidth>
                                                        <Select
                                                            value={editForm.status}
                                                            inputProps={{ 'aria-label': 'Item status' }}
                                                            onChange={(e) => {
                                                                setEditForm({
                                                                    ...editForm,
                                                                    status: e.target.value as ItemStatus,
                                                                });
                                                            }}
                                                        >
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <MenuItem key={status} value={status}>
                                                                    {status}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Typography variant="body1" component="span">{item.status}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <FormControl size="small" fullWidth>
                                                        <Select
                                                            value={editForm.priority}
                                                            inputProps={{ 'aria-label': 'Item priority' }}
                                                            onChange={(e) => {
                                                                setEditForm({
                                                                    ...editForm,
                                                                    priority: Number(e.target.value) as ItemPriority,
                                                                });
                                                            }}
                                                        >
                                                            {PRIORITY_OPTIONS.map((priority) => (
                                                                <MenuItem key={priority} value={priority}>
                                                                    {priority}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Typography variant="body1" component="span">{item.priority}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    justifyContent: 'flex-end',
                                                    minHeight: 40,
                                                    alignItems: 'center',
                                                }}>
                                                    {!isRowSaving ? (
                                                        <>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                disabled={isRowSaving || (editingItemId !== null && !isEditing) || isSaveDisabled}
                                                                onClick={() => isEditing ? handleSaveItem(item.id) : handleEditItem(item)}
                                                            >
                                                                {isEditing ? 'Save' : 'Edit'}
                                                            </Button>
                                                            {isEditing && (
                                                                <Button
                                                                    variant="outlined"
                                                                    color="inherit"
                                                                    disabled={isRowSaving}
                                                                    onClick={handleCancelEdit}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                            {!isEditing && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    disabled={isRowSaving}
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : <CircularProgress size={28} />}
                                                </Box>
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
