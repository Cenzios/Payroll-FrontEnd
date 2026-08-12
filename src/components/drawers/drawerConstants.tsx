// Shared constants and small UI primitives for the drawer components

export const SRI_LANKAN_BANKS = [
    "Bank of Ceylon",
    "People's Bank",
    "Commercial Bank of Ceylon",
    "Hatton National Bank (HNB)",
    "Sampath Bank",
    "Seylan Bank",
    "Nations Trust Bank (NTB)",
    "DFCC Bank",
    "National Development Bank (NDB)",
    "Pan Asia Banking Corporation (PABC)",
    "Union Bank of Colombo",
    "Amana Bank",
    "Cargills Bank",
];

export const Toggle = ({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) => (
    <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-[#367AFF]" : "bg-gray-300"}`}
    >
        <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-4" : "translate-x-0"}`}
        />
    </button>
);
