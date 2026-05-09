import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ correo: '', password: '' });
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validación en tiempo real
  const validateEmail = (email) => {
    if (!email) return 'El correo es requerido';
    if (!email.includes('@')) return 'Ingresa un correo válido';
    if (!email.includes('.')) return 'Ingresa un correo válido';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setCorreo(value);
    setFieldErrors(prev => ({ ...prev, correo: validateEmail(value) }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setFieldErrors(prev => ({ ...prev, password: validatePassword(value) }));
  };

  useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!correo || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!correo.includes('@')) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login({ correo, password });
      
      if (!result.success) {
        // Mensajes específicos según el error
        if (result.error?.includes('incorrectas')) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (result.error?.includes('conexión')) {
          setError('Error de conexión con el servidor. Intenta nuevamente más tarde.');
        } else {
          setError(result.error || 'Error al iniciar sesión. Intenta nuevamente.');
        }
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu red y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <span className="logo-icon">🛡️</span>
            <div className="logo-text">
              <h1>Panel de Seguridad UTA</h1>
              <p>Sistema de Gestión de Seguridad</p>
            </div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={handleEmailChange}
              placeholder="tu@correo.com"
              className={`form-input ${fieldErrors.correo ? 'error' : ''}`}
              required
            />
            {fieldErrors.correo && (
              <span className="field-error">{fieldErrors.correo}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="•••••••"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              required
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Usa tus credenciales del sistema UTA</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
