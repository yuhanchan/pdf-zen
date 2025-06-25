import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Merge from './components/Merge';
import Split from './components/Split';
import Organize from './components/Organize';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="bg-light border-bottom shadow-sm p-3">
          <nav className="container d-flex justify-content-between">
            <Link to="/" className="navbar-brand fw-bold">PDF Zen</Link>
            <div>
              <Link to="/merge" className="btn btn-outline-primary me-2">Merge</Link>
              <Link to="/split" className="btn btn-outline-primary me-2">Split</Link>
              <Link to="/organize" className="btn btn-outline-primary">Organize</Link>
            </div>
          </nav>
        </header>

        <main className="container mt-5">
          <Routes>
            <Route path="/merge" element={<Merge />} />
            <Route path="/split" element={<Split />} />
            <Route path="/organize" element={<Organize />} />
            <Route path="/" element={
              <div>
                <h1 className="display-4">Welcome to PDF Zen</h1>
                <p className="lead">A fast, free, and secure way to manage your PDF files.</p>
                <hr className="my-4" />
                <p>All processing is done in your browser. No files are ever uploaded to a server.</p>
                <p>Select a tool from the navigation bar to get started.</p>
              </div>
            } />
          </Routes>
        </main>

        <footer className="text-center mt-5 p-3 bg-light">
          <p>&copy; 2025 PDF Zen</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;