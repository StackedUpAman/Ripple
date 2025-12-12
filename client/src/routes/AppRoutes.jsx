import Signup from "../pages/Signup";
import Login from "../pages/Login";
import {Route,Router,Routes} from "react-router-dom"
function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="api">
          <Route path="login" element={<Login/>} />
          <Route path="signup" element={<Signup/>} />
        </Route>
      </Routes>
    </>
  );
}

export default AppRoutes;
