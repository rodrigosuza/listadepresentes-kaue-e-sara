import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

const TesteApp: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-100 space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-marsala-100 rounded-full flex items-center justify-center mx-auto text-marsala-800">
                    <Home size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="font-serif text-3xl text-stone-800">Subsite de Teste</h1>
                    <p className="text-stone-500 text-sm">
                        Este é um exemplo de como você pode ter múltiplos sites dentro do seu domínio.
                    </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl text-left border border-stone-100">
                    <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">URL de Acesso</p>
                    <code className="text-marsala-700 text-xs break-all">
                        kaue-sara.vercel.app/teste.html
                    </code>
                </div>

                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-stone-500 hover:text-marsala-800 transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Voltar ao site principal
                </a>
            </div>

            <p className="mt-8 text-stone-300 text-[10px] uppercase tracking-widest">
                Configuração Vite MPA ativa
            </p>
        </div>
    );
};

export default TesteApp;
