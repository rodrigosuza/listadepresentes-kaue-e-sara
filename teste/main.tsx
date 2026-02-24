import React from 'react';
import ReactDOM from 'react-dom/client';
import TesteApp from '../TesteApp';
// import '../index.css'; // Removido para evitar erro de build se o arquivo não for rastreado


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TesteApp />
    </React.StrictMode>
);
