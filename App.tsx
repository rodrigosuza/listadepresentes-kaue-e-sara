import React, { useEffect, useState, useMemo } from 'react';
import { Gift, GiftStatus } from './types';
import { GiftCard } from './components/GiftCard';
import { Pagination } from './components/Pagination';
import { GuestModal } from './components/GuestModal';
import { AdminPanel } from './components/AdminPanel';
import { Lock, Heart } from 'lucide-react';
import { supabase } from './services/supabase';

const ITEMS_PER_PAGE = 30;

const App: React.FC = () => {
  // State
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGiftForModal, setSelectedGiftForModal] = useState<Gift | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Security: Block F12, Right Click, and Copy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Load data from Supabase
  const loadGifts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading gifts:', error);
    } else if (data) {
      // Map database snake_case to camelCase
      const mappedGifts: Gift[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_url,
        status: item.status,
        guestName: item.guest_name,
        guestPhone: item.guest_phone
      }));
      setGifts(mappedGifts);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGifts();
  }, []);

  // Logic: Sorting (Available first, Selected last)
  const sortedGifts = useMemo(() => {
    return [...gifts].sort((a, b) => {
      const statusA = a.status === 'available' ? 0 : 1;
      const statusB = b.status === 'available' ? 0 : 1;

      if (statusA !== statusB) return statusA - statusB;
      return a.name.localeCompare(b.name);
    });
  }, [gifts]);

  // Logic: Pagination
  const totalPages = Math.ceil(sortedGifts.length / ITEMS_PER_PAGE);
  const currentGifts = sortedGifts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handlers
  const handleGuestSelect = (gift: Gift) => {
    setSelectedGiftForModal(gift);
  };

  const handleGuestConfirm = async (name: string, phoneNumber: string) => {
    if (!selectedGiftForModal) return;

    const { error } = await supabase
      .from('gifts')
      .update({
        status: 'selected',
        guest_name: name,
        guest_phone: phoneNumber
      })
      .eq('id', selectedGiftForModal.id);

    if (error) {
      console.error('Error confirming gift:', error);
      alert("Ocorreu um erro ao confirmar o presente. Tente novamente.");
    } else {
      setGifts(prev => prev.map(g => {
        if (g.id === selectedGiftForModal.id) {
          return { ...g, status: 'selected', guestName: name, guestPhone: phoneNumber };
        }
        return g;
      }));
      setSelectedGiftForModal(null);
      alert("Obrigado! Seu presente foi confirmado.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Muni1234eli@') {
      setIsAdminAuthenticated(true);
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
  };

  const handleAddGift = async (newGift: Omit<Gift, 'id' | 'status'>) => {
    const { data, error } = await supabase
      .from('gifts')
      .insert([{
        name: newGift.name,
        image_url: newGift.imageUrl,
        status: 'available'
      }])
      .select();

    if (error) {
      console.error('Error adding gift:', error);
      alert(`Erro ao adicionar presente: ${error.message || 'Erro desconhecido'}`);
    } else if (data && data[0]) {
      const addedGift: Gift = {
        id: data[0].id,
        name: data[0].name,
        imageUrl: data[0].image_url,
        status: data[0].status
      };
      setGifts(prev => [addedGift, ...prev]);
    }
  };

  const handleBulkAdd = async (newGifts: Gift[]) => {
    // For bulk add, we need to map names too
    const items = newGifts.map(g => ({
      name: g.name,
      image_url: g.imageUrl,
      status: 'available'
    }));

    const { data, error } = await supabase
      .from('gifts')
      .insert(items)
      .select();

    if (error) {
      console.error('Error in bulk add:', error);
      alert("Erro ao adicionar lista.");
    } else {
      await loadGifts(); // Reload to get fresh IDs and order
    }
  }

  const handleRemoveGift = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este item?")) {
      const { error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing gift:', error);
        alert("Erro ao remover presente.");
      } else {
        setGifts(prev => prev.filter(g => g.id !== id));
      }
    }
  };

  const handleResetGift = async (id: string) => {
    const { error } = await supabase
      .from('gifts')
      .update({
        status: 'available',
        guest_name: null,
        guest_phone: null
      })
      .eq('id', id);

    if (error) {
      console.error('Error resetting gift:', error);
      alert("Erro ao liberar presente.");
    } else {
      setGifts(prev => prev.map(g => {
        if (g.id === id) {
          return { ...g, status: 'available', guestName: undefined, guestPhone: undefined };
        }
        return g;
      }));
    }
  };

  // Render Login Modal if Admin is requested but not auth
  const renderLoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xs w-full">
        <h2 className="text-xl font-serif text-marsala-800 mb-4 text-center">Área Restrita</h2>
        <form onSubmit={handleAdminLogin} className="space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            placeholder="Senha de acesso"
            className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-marsala-400 outline-none text-sm"
            autoFocus
          />
          {authError && <p className="text-red-500 text-xs text-center">Senha incorreta.</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdminOpen(false)}
              className="flex-1 py-2 text-stone-500 hover:bg-stone-100 rounded text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-marsala-800 text-white py-2 rounded hover:bg-marsala-700 text-sm"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-marsala-200">

      {/* Navigation Bar - Compact for Mobile */}
      <nav className="fixed w-full z-40 bg-white/95 backdrop-blur-md border-b border-marsala-100 shadow-sm transition-all h-14 md:h-16">
        <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl md:text-2xl tracking-tight text-marsala-900">Kaue & Sara</span>
          </div>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 text-stone-400 hover:text-marsala-800 transition-colors"
            aria-label="Área dos Noivos"
          >
            <Lock size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section - Optimized for Mobile */}
      <header className="relative pt-24 pb-10 px-4 text-center marsala-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-lg mx-auto space-y-3">
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide">Lista de Presentes</h1>
          <p className="font-sans text-sm md:text-base font-light opacity-90 leading-relaxed max-w-xs mx-auto">
            Sua presença é nosso maior presente. Escolhemos cada item com carinho.
          </p>
        </div>
      </header>

      {/* Main Content - Mobile Exclusive Layout */}
      <main className="max-w-md md:max-w-2xl mx-auto px-2 py-6">

        {loading ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg font-serif animate-pulse">Carregando presentes...</p>
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg font-serif">A lista de presentes está sendo preparada...</p>
          </div>
        ) : (
          <>
            {/* STRICT 3-COLUMN GRID FOR MOBILE AS REQUESTED */}
            <div className="grid grid-cols-3 gap-2">
              {currentGifts.map(gift => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  onSelect={handleGuestSelect}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setCurrentPage(p);
              }}
            />
          </>
        )}

      </main>

      {/* Footer - Enlarged and Premium */}
      <footer className="bg-marsala-900 border-t border-marsala-800 pt-16 pb-12 text-center px-4 mt-6">
        <div className="max-w-xs mx-auto space-y-8">
          <div className="space-y-2">
            <p className="font-serif text-4xl text-white tracking-widest">Kaue & Sara</p>
            <div className="w-12 h-0.5 bg-marsala-400 mx-auto rounded-full"></div>
            <p className="text-marsala-200 text-sm uppercase tracking-widest font-light">Casamento 2026</p>
          </div>

          <p className="text-marsala-100/60 font-serif italic text-lg leading-relaxed">
            "O amor é paciente, o amor é bondoso..."
          </p>

          <div className="pt-8 border-t border-marsala-800/50">
            <p className="text-marsala-300/40 text-[10px] uppercase font-bold tracking-widest mb-1">
              Feito com carinho por
            </p>
            <a
              href="https://www.instagram.com/souza_dsr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-marsala-200 transition-colors font-sans text-sm tracking-wide"
            >
              Rodrigo Souza
            </a>
            <p className="text-marsala-400 text-[10px] flex items-center justify-center gap-1 mt-2">
              Melhor amigo da Noiva <Heart size={8} className="text-marsala-500 fill-marsala-500" />
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GuestModal
        gift={selectedGiftForModal}
        isOpen={!!selectedGiftForModal}
        onClose={() => setSelectedGiftForModal(null)}
        onConfirm={handleGuestConfirm}
      />

      {isAdminOpen && !isAdminAuthenticated && renderLoginModal()}

      {isAdminOpen && isAdminAuthenticated && (
        <AdminPanel
          gifts={gifts}
          onClose={() => setIsAdminOpen(false)}
          onAddGift={handleAddGift}
          onRemoveGift={handleRemoveGift}
          onResetGift={handleResetGift}
          onBulkAdd={handleBulkAdd}
          onLogout={() => {
            setIsAdminAuthenticated(false);
            setIsAdminOpen(false);
          }}
        />
      )}

    </div>
  );
};

export default App;