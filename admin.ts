// Home Page - Luxury Portfolio Design with Media Carousel
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, MessageCircle, ChevronDown, ChevronUp, FolderOpen, Play, Image as ImageIcon, ExternalLink, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import MediaCarousel from "@/components/MediaCarousel";
import { motion, AnimatePresence } from "framer-motion";

interface PortfolioItem {
  id: number;
  categoryId: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  thumbnail?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  items: PortfolioItem[];
}

interface MediaItem {
  id: number;
  fileUrl: string;
  fileType: "image" | "video";
  title: string;
  thumbnail?: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<MediaItem[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes, settingsRes] = await Promise.all([
        fetch("/api/portfolio/categories"),
        fetch("/api/admin/settings"),
      ]);

      if (!categoriesRes.ok) throw new Error("فشل في جلب البيانات");
      
      const categoriesData = await categoriesRes.json();
      
      const sanitizedCategories = categoriesData.map((cat: Category) => ({
        ...cat,
        items: cat.items.map((item: PortfolioItem) => {
          let fileUrl = item.fileUrl;
          if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
            fileUrl = `/${fileUrl}`;
          }
          return { ...item, fileUrl };
        })
      }));
      
      setCategories(sanitizedCategories);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.whatsappNumber) {
          setWhatsappNumber(settingsData.whatsappNumber);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsappClick = () => {
    if (whatsappNumber) {
      const message = encodeURIComponent("مرحباً، أود التواصل معك بخصوص أعمالك");
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openMediaCarousel = (items: PortfolioItem[], startIndex: number) => {
    const mediaItems: MediaItem[] = items.map(item => ({
      id: item.id,
      fileUrl: item.fileUrl,
      fileType: (item.fileType === "image" || item.fileType === "video") ? item.fileType : "image",
      title: item.title,
      thumbnail: item.thumbnail
    }));
    setCarouselItems(mediaItems);
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-primary font-medium tracking-widest uppercase text-sm">جاري تحميل الفخامة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            {whatsappNumber && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsappClick}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-500 border border-green-500/30 font-semibold px-4 py-2 rounded-full transition-all backdrop-blur-sm"
                title="تواصل معنا عبر واتساب"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 font-semibold px-4 py-2 rounded-full transition-all backdrop-blur-sm"
              title="الدخول إلى لوحة التحكم"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <motion.div 
                  className="absolute -inset-1 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition duration-1000 group-hover:duration-200 animate-pulse"
                ></motion.div>
                <motion.img 
                  src="/images/logo.png" 
                  alt="Sara Star Stationary" 
                  className="relative h-48 w-48 md:h-64 md:w-64 object-cover rounded-full border-2 border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
            <div className="mb-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {error ? (
          <div className="text-center py-20 glass-card rounded-3xl p-12">
            <p className="text-red-400 mb-6 text-lg">{error}</p>
            <Button onClick={fetchData} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">إعادة محاولة</Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-3xl p-12">
            <p className="text-slate-400 mb-6 text-lg">لا توجد فئات متاحة حالياً</p>
            <Button onClick={() => setLocation("/admin")} className="bg-primary text-black">الذهاب إلى لوحة التحكم</Button>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Categories & Items Grid */}
            <div className="flex flex-col gap-12">
              {categories.map((category, index) => (
                <div key={category.id} className="flex flex-col gap-8">
                  {/* Category Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={`group relative w-full text-right overflow-hidden rounded-3xl transition-all duration-500 ${
                        expandedCategories.has(category.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl transition-colors duration-500 ${
                            expandedCategories.has(category.id) ? 'bg-primary text-black' : 'bg-white/5 text-primary group-hover:bg-primary/20'
                          }`}>
                            <FolderOpen className="w-8 h-8" />
                          </div>
                          <div className="text-slate-500 text-sm font-mono">
                            {String(category.items.length).padStart(2, '0')} PROJECTS
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
                          {category.description || "استعرض مجموعة من أفضل أعمالنا في هذا المجال."}
                        </p>
                        <div className="flex items-center text-primary font-semibold text-sm tracking-wider uppercase">
                          {expandedCategories.has(category.id) ? "إغلاق التفاصيل" : "عرض الأعمال"}
                          <ArrowRight className={`ml-2 w-4 h-4 transition-transform duration-300 ${expandedCategories.has(category.id) ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                        </div>
                      </div>
                      
                      {/* Decorative element */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                    </button>
                  </motion.div>

                  {/* Category Items (Appears directly below the button when expanded) */}
                  <AnimatePresence>
                    {expandedCategories.has(category.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-primary/10">
                          {category.items.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                              <p className="text-slate-500">لا توجد أعمال مضافة في هذه الفئة بعد.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {category.items.map((item, idx) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <Card 
                                    className="group bg-[#151515] border-white/5 overflow-hidden rounded-3xl hover:border-primary/30 transition-all duration-500 cursor-pointer"
                                    onClick={() => openMediaCarousel(category.items, idx)}
                                  >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                      {item.fileType === "image" ? (
                                        <img
                                          src={item.thumbnail || item.fileUrl}
                                          alt={item.title}
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                          <video
                                            src={item.fileUrl}
                                            className="w-full h-full object-cover opacity-60"
                                            muted
                                            loop
                                            onMouseOver={(e) => e.currentTarget.play()}
                                            onMouseOut={(e) => e.currentTarget.pause()}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-primary/30">
                                              <Play className="w-6 h-6 text-primary fill-primary" />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                        <div className="flex gap-3">
                                          <Button
                                            size="sm"
                                            className="bg-primary text-black font-bold rounded-full"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openMediaCarousel(category.items, idx);
                                            }}
                                          >
                                            {item.fileType === "image" ? <ImageIcon className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                            عرض العمل
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <CardHeader className="p-6">
                                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{item.title}</CardTitle>
                                      {item.description && (
                                        <CardDescription className="text-slate-400 line-clamp-2 mt-2">{item.description}</CardDescription>
                                      )}
                                    </CardHeader>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6">
            {whatsappNumber && (
              <button onClick={handleWhatsappClick} className="transition-all hover:scale-110">
                <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Media Carousel */}
      <AnimatePresence>
        {carouselOpen && (
          <MediaCarousel
            items={carouselItems}
            initialIndex={carouselIndex}
            onClose={() => setCarouselOpen(false)}
            whatsappNumber={whatsappNumber}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
