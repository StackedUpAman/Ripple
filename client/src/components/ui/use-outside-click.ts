import SignupForm from "../pages/Signup";
import LoginForm from '../pages/Login';
import Home from "../pages/Home";
import GroupChatPage from "../pages/GroupChatPage";
import {Route, Routes} from "react-router-dom"

function AppRoutes() {
  return (
    <Routes>          
      <Route path="/" element={<Home/>} />
      <Route path="/Home" element={<Home/>} />
      <Route path="/login" element={<LoginForm/>} />
      <Route path="/signup" element={<SignupForm/>} />
      <Route path="/chat" element={<GroupChatPage/>} />
      <Route path="/groupChatRoom" element={<GroupChatPage/>} />
    </Routes>
  );
}

export default AppRoutes;
