import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import CoursePlayer from "./pages/CoursePlayer";
import MyLearning from "./pages/MyLearning";
import InstructorPanel from "./pages/InstructorPanel";
import CourseEditor from "./pages/CourseEditor";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { AuthProvider } from "./context/AuthContext";
import NotFound from "./pages/NotFound";

const App = () => {
    const location = useLocation();
    const isPlayer = location.pathname.startsWith("/learn/");
    return (
        <AuthProvider>
            <div
                className={`flex flex-col bg-page font-sans text-ink ${isPlayer ? "h-dvh overflow-hidden" : "min-h-screen"}`}
            >
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: "#26180f",
                            color: "#f8ebdd",
                            border: "1px solid #3a2616",
                        },
                        success: {
                            iconTheme: {
                                primary: "#ff7a1a",
                                secondary: "#1a0e05",
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: "#f2607a",
                                secondary: "#1a0e05",
                            },
                        },
                    }}
                />

                <AuthModal />
                <Navbar />
                <main
                    className={`flex-1 ${isPlayer ? "min-h-0 overflow-hidden" : ""}`}
                >
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route
                            path="/courses/:id"
                            element={<CourseDetails />}
                        />
                        <Route path="/learn/:id" element={<CoursePlayer />} />
                        <Route path="/my-learning" element={<MyLearning />} />
                        <Route
                            path="/intructor"
                            element={<InstructorPanel />}
                        />
                        <Route
                            path="/intructor/editor"
                            element={<CourseEditor />}
                        />
                        <Route
                            path="/intructor/editor/:id"
                            element={<CourseEditor />}
                        />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
                {!isPlayer && <Footer />}
            </div>
        </AuthProvider>
    );
};

export default App;
