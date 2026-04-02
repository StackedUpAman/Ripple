import { initSocket } from "./socket";

export const connectSocket = () => {
    const token = localStorage.getItem('token');
    if(!token) throw new Error("No token received");
    
    initSocket(token);
}
