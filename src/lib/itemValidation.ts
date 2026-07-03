export const getItemNameValidationError = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
        return 'Name is required';
    }

    if (trimmedName.length < 2 || trimmedName.length > 60) {
        return 'Name must be between 2 and 60 characters';
    }

    return '';
};
