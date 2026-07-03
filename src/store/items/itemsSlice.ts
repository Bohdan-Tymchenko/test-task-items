import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { CreateItemPayload, Item, UpdateItemPayload, UpdateItemsPayload } from "../../types";
import { apiClient } from "../../api/apiClient";

type ItemsState = {
    items: Item[];
    isLoading: boolean;
    isCreating: boolean;
    savingItemIds: string[];
    error: string | null;
};

const initialState: ItemsState = {
    items: [],
    isLoading: false,
    isCreating: false,
    savingItemIds: [],
    error: null,
};

const addSavingItemIds = (state: ItemsState, ids: string[]) => {
    const nextSavingIds = new Set([...state.savingItemIds, ...ids]);
    state.savingItemIds = [...nextSavingIds];
};

const removeSavingItemIds = (state: ItemsState, ids: string[]) => {
    state.savingItemIds = state.savingItemIds.filter((id) => !ids.includes(id));
};

export const getItemsThunk = createAsyncThunk(
    'items/getItems',
    async () => {
        const items = await apiClient.getItems();

        return items;
    }
)

export const updateItemThunk = createAsyncThunk(
    'items/updateItem',
    async (payload: { id: string, payload: UpdateItemPayload }) => {
        const item = await apiClient.updateItem(payload.id, payload.payload);

        return item;
    }
)

export const updateItemsThunk = createAsyncThunk(
    'items/updateItems',
    async (payload: { ids: string[], payload: UpdateItemsPayload }) => {
        const items = await apiClient.updateItems(payload.ids, payload.payload);

        return items;
    }
)

export const createItemThunk = createAsyncThunk(
    'items/createItem',
    async (payload: CreateItemPayload) => {
        const item = await apiClient.createItem(payload);

        return item;
    }
)

export const deleteItemsThunk = createAsyncThunk(
    'items/deleteItems',
    async (ids: string[]) => {
        await apiClient.deleteItems(ids);

        return ids;
    }
)

export const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // GET items
            .addCase(getItemsThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getItemsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.items = action.payload;
            })
            .addCase(getItemsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Getting items failed';
            })
            // UPDATE item
            .addCase(updateItemThunk.pending, (state, action) => {
                addSavingItemIds(state, [action.meta.arg.id]);
                state.error = null;
            })
            .addCase(updateItemThunk.fulfilled, (state, action) => {
                state.error = null;
                removeSavingItemIds(state, [action.payload.id]);
                state.items = state.items.map((item) =>
                    item.id === action.payload.id ? action.payload : item
                );
            })
            .addCase(updateItemThunk.rejected, (state, action) => {
                removeSavingItemIds(state, [action.meta.arg.id]);
                state.error = action.error.message ?? 'Updating item failed';
            })
            // UPDATE items
            .addCase(updateItemsThunk.pending, (state, action) => {
                addSavingItemIds(state, action.meta.arg.ids);
                state.error = null;
            })
            .addCase(updateItemsThunk.fulfilled, (state, action) => {
                state.error = null;
                removeSavingItemIds(state, action.meta.arg.ids);

                const updatedItemsById = new Map(action.payload.map((item) => [item.id, item]));
                state.items = state.items.map((item) => updatedItemsById.get(item.id) ?? item);
            })
            .addCase(updateItemsThunk.rejected, (state, action) => {
                removeSavingItemIds(state, action.meta.arg.ids);
                state.error = action.error.message ?? 'Updating items failed';
            })
            // CREATE item
            .addCase(createItemThunk.pending, (state) => {
                state.isCreating = true;
                state.error = null;
            })
            .addCase(createItemThunk.fulfilled, (state, action) => {
                state.isCreating = false;
                state.error = null;
                state.items = [...state.items, action.payload];
            })
            .addCase(createItemThunk.rejected, (state, action) => {
                state.isCreating = false;
                state.error = action.error.message ?? 'Creating item failed';
            })
            // DELETE items
            .addCase(deleteItemsThunk.pending, (state, action) => {
                addSavingItemIds(state, action.meta.arg);
                state.error = null;
            })
            .addCase(deleteItemsThunk.fulfilled, (state, action) => {
                state.error = null;
                removeSavingItemIds(state, action.payload);
                state.items = state.items.filter((item) => !action.payload.includes(item.id));
            })
            .addCase(deleteItemsThunk.rejected, (state, action) => {
                removeSavingItemIds(state, action.meta.arg);
                state.error = action.error.message ?? 'Deleting items failed';
            })
    }

})

export const itemsReducer = itemsSlice.reducer;
