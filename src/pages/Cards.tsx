import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import VirtualCard from "@/components/VirtualCard";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, Loader2, X, CreditCard, Snowflake, Play, Trash2, SlidersHorizontal } from "lucide-react";
import { useVirtualCards, useCreateCard, useUpdateCard } from "@/hooks/useVirtualCards";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Cards = () => {
  const { profile } = useAuth();
  const { data: cards, isLoading } = useVirtualCards();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const [showCreate, setShowCreate] = useState(false);
  const [cardName, setCardName] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("5000");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");

  const activeCards = cards?.filter(c => c.status !== "cancelled") ?? [];
  const totalSpent = activeCards.reduce((sum, c) => sum + c.amount_spent_month, 0);
  const totalTransactions = activeCards.length;

  const handleCreate = async () => {
    const name = cardName.trim() || profile?.full_name || "OVO USER";
    try {
      await createCard.mutateAsync({
        cardHolderName: name,
        spendingLimit: parseFloat(spendingLimit) || 5000,
      });
      toast.success("Virtual card created!");
      setShowCreate(false);
      setCardName("");
      setSpendingLimit("5000");
    } catch (err: any) {
      toast.error(err.message || "Failed to create card");
    }
  };

  const handleToggleFreeze = async (card: typeof activeCards[0]) => {
    const newStatus = card.status === "frozen" ? "active" : "frozen";
    try {
      await updateCard.mutateAsync({ id: card.id, status: newStatus });
      toast.success(newStatus === "frozen" ? "Card frozen" : "Card unfrozen");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateLimit = async (cardId: string) => {
    const limit = parseFloat(newLimit);
    if (!limit || limit <= 0) { toast.error("Invalid limit"); return; }
    try {
      await updateCard.mutateAsync({ id: cardId, spending_limit: limit });
      toast.success("Spending limit updated");
      setEditingCard(null);
      setNewLimit("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (cardId: string) => {
    try {
      await updateCard.mutateAsync({ id: cardId, status: "cancelled" });
      toast.success("Card cancelled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-foreground">Virtual Cards</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-muted animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            </div>
          </div>
        ) : activeCards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground mb-2">No Cards Yet</h2>
            <p className="text-sm text-muted-foreground font-body mb-8 max-w-[240px]">
              Create a virtual USD card for online payments worldwide
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold font-display shadow-wallet hover:bg-primary/90 transition-colors"
            >
              Create Your First Card
            </button>
          </motion.div>
        ) : (
          <>
            {/* Card carousel */}
            <div className="space-y-4">
              {activeCards.map((card) => (
                <div key={card.id}>
                  <VirtualCard
                    card={card}
                    onToggleFreeze={() => handleToggleFreeze(card)}
                  />

                  {/* Card actions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 mt-3"
                  >
                    <button
                      onClick={() => handleToggleFreeze(card)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium font-body transition-colors ${
                        card.status === "frozen"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {card.status === "frozen" ? <Play className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
                      {card.status === "frozen" ? "Unfreeze" : "Freeze"}
                    </button>
                    <button
                      onClick={() => { setEditingCard(card.id); setNewLimit(card.spending_limit.toString()); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-medium font-body transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Limit
                    </button>
                    <button
                      onClick={() => handleCancel(card.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium font-body transition-colors hover:bg-destructive/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>

                  {/* Edit limit inline */}
                  <AnimatePresence>
                    {editingCard === card.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
                          <p className="text-xs text-muted-foreground font-body mb-2">Spending Limit (USD)</p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={newLimit}
                              onChange={(e) => setNewLimit(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm font-body text-foreground outline-none"
                              inputMode="decimal"
                            />
                            <button
                              onClick={() => handleUpdateLimit(card.id)}
                              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold font-body"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCard(null)}
                              className="p-2 rounded-lg bg-muted text-muted-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats for this card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3 grid grid-cols-2 gap-3"
                  >
                    <div className="p-4 rounded-2xl bg-card shadow-card border border-border">
                      <p className="text-xs text-muted-foreground font-body">Spent This Month</p>
                      <p className="text-xl font-bold font-display text-foreground mt-1">
                        ${card.amount_spent_month.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card shadow-card border border-border">
                      <p className="text-xs text-muted-foreground font-body">Card Limit</p>
                      <p className="text-xl font-bold font-display text-foreground mt-1">
                        ${card.spending_limit.toLocaleString()}
                      </p>
                      <div className="mt-2 w-full h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${Math.min((card.amount_spent_month / card.spending_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Create new card */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setShowCreate(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium font-body">Create New Card</span>
            </motion.button>
          </>
        )}

        {/* Create card bottom sheet */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-elevated"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display text-foreground">Create Virtual Card</h2>
                      <p className="text-xs text-muted-foreground font-body">USD Visa card for online payments</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-body mb-1.5 block">Card Holder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={profile?.full_name || "Your full name"}
                      className="w-full px-4 py-3 rounded-xl bg-muted text-sm font-body text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-body mb-1.5 block">Monthly Spending Limit ($)</label>
                    <input
                      type="number"
                      value={spendingLimit}
                      onChange={(e) => setSpendingLimit(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted text-sm font-body text-foreground outline-none"
                      inputMode="decimal"
                    />
                    <div className="flex gap-2 mt-2">
                      {[1000, 2500, 5000, 10000].map((v) => (
                        <button
                          key={v}
                          onClick={() => setSpendingLimit(v.toString())}
                          className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-medium font-body text-foreground hover:bg-border transition-colors"
                        >
                          ${v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={createCard.isPending}
                  className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-base disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {createCard.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Create Card"
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default Cards;
