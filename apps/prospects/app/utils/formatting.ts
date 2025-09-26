export const cpf = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length !== 11) return value;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export const cnpj = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length !== 14) return value;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export const phone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 11) return value;
    return cleaned.length === 10
        ? cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
        : cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

export const phoneInternational = (value: string): { success: true; phone: string } | { success: false; error: string } => {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length < 10 || cleaned.length > 11) {
        return { success: false, error: "Phone number must have 10 or 11 digits" };
    }

    const formattedPhone = `+55${cleaned}`;

    return { success: true, phone: formattedPhone };
}