import { useAuth as useContextAuth } from "@/context/AuthContext";

export const useAuth = () => {
    return useContextAuth();
};
