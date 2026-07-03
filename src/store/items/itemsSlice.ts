import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Item } from "../../types";
import { apiClient } from "../../api/apiClient";
import type { ItemPayload } from "../../types";

type ItemsState = {
    items: Item[];
    isLoading: boolean;
    error: string | null;
};

const initialState: ItemsState = {
    items: [],
    isLoading: false,
    error: null,
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
    async (payload: { id: string, payload: ItemPayload }) => {
        const item = await apiClient.updateItem(payload.id, payload.payload);

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
            .addCase(updateItemThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateItemThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.items = state.items.map((item) =>
                    item.id === action.payload.id ? action.payload : item
                );
            })
            .addCase(updateItemThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Updating item failed';
            })
            // DELETE items
            .addCase(deleteItemsThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteItemsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.items = state.items.filter((item) => !action.payload.includes(item.id));
            })
            .addCase(deleteItemsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Deleting items failed';
            })
    }

})

export const itemsReducer = itemsSlice.reducer;