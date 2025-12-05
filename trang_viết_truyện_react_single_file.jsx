import React, { useEffect, useState } from 'react';

// Single-file React component for a story-writing page.
// Uses Tailwind CSS classes for styling. Exports default component.
// Features:
// - Cover image + story title
// - View count (mắt xem)
// - Reactions (haha, khóc, tim, like, phẫn nộ, wow, thương thương)
// - Comments
// - Chapters list (thêm/xóa/chọn) and chapter content editor
// - Chapter thumbnail image
// - LocalStorage persistence

export default function StoryWriterPage() {
  const initialState = {
    title: 'Tiêu đề truyện của bạn',
    cover: null,
    views: 0,
    reactions: {
      haha: 0,
      cry: 0,
      heart: 0,
      like: 0,
      angry: 0,
      wow: 0,
      pity: 0,
    },
    chapters: [
      { id: 1, title: 'Chương 1', content: 'Viết nội dung chương 1 ở đây...', thumb: null },
    ],
    comments: [],
  };

  const [story, setStory] = useState(() => {
    try {
      const raw = localStorage.getItem('story-data');
      return raw ? JSON.parse(raw) : initialState;
    } catch (e) {
      return initialState;
    }
  });

  const [activeChapterId, setActiveChapterId] = useState(story.chapters[0]?.id ?? null);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // Increment views on mount (simulate a view)
  useEffect(() => {
    setStory(prev => {
      const updated = { ...prev, views: prev.views + 1 };
      localStorage.setItem('story-data', JSON.stringify(updated));
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever story changes
  useEffect(() => {
    localStorage.setItem('story-data', JSON.stringify(story));
  }, [story]);

  const handleCoverChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStory(prev => ({ ...prev, cover: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const updateTitle = e => setStory(prev => ({ ...prev, title: e.target.value }));

  const reactionMap = {
    haha: '😂',
    cry: '😢',
    heart: '❤️',
    like: '👍',
    angry: '😡',
    wow: '😮',
    pity: '🥲',
  };

  const react = key => {
    setStory(prev => ({
      ...prev,
      reactions: { ...prev.reactions, [key]: prev.reactions[key] + 1 },
    }));
  };

  const addChapter = () => {
    const newId = Date.now();
    const newChap = { id: newId, title: `Chương ${story.chapters.length + 1}`, content: '', thumb: null };
    setStory(prev => ({ ...prev, chapters: [...prev.chapters, newChap] }));
    setActiveChapterId(newId);
  };

  const removeChapter = id => {
    const filtered = story.chapters.filter(c => c.id !== id);
    setStory(prev => ({ ...prev, chapters: filtered }));
    if (activeChapterId === id && filtered[0]) setActiveChapterId(filtered[0].id);
  };

  const updateChapter = (id, patch) => {
    setStory(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleThumbChange = (e, chapterId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateChapter(chapterId, { thumb: reader.result });
    reader.readAsDataURL(file);
  };

  const activeChapter = story.chapters.find(c => c.id === activeChapterId) ?? story.chapters[0];

  const addComment = () => {
    if (!newCommentText.trim()) return;
    const comment = {
      id: Date.now(),
      name: newCommentName?.trim() || 'Bạn đọc',
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };
    setStory(prev => ({ ...prev, comments: [comment, ...prev.comments] }));
    setNewCommentName('');
    setNewCommentText('');
  };

  const resetStory = () => {
    if (!confirm('Bạn có chắc muốn reset toàn bộ dữ liệu (lưu trữ cục bộ) không?')) return;
    localStorage.removeItem('story-data');
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header / Cover */}
      <div className="flex gap-6 mb-6 items-center">
        <div className="w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {story.cover ? (
            <img src={story.cover} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="text-sm text-gray-400">Chưa có ảnh bìa</div>
          )}
        </div>
        <div className="flex-1">
          <input
            value={story.title}
            onChange={updateTitle}
            className="w-full text-2xl font-semibold border-b pb-2 focus:outline-none"
            placeholder="Nhập tiêu đề truyện..."
          />
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={handleCoverChange} />
              <span className="underline cursor-pointer">Thay ảnh bìa</span>
            </label>
            <button onClick={resetStory} className="text-red-500 underline">Reset (xóa dữ liệu)</button>
          </div>
        </div>

        <div className="w-40 text-right">
          <div className="text-xs text-gray-500">Mắt xem</div>
          <div className="text-xl font-bold">{story.views}</div>
        </div>
      </div>

      {/* Main layout: Chapters | Reader & Editor */}
      <div className="grid grid-cols-4 gap-6">
        {/* Left: Chapters */}
        <aside className="col-span-1 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Mục / Chương</h3>
            <button className="text-sm underline" onClick={addChapter}>Thêm</button>
          </div>
          <ul className="space-y-2">
            {story.chapters.map(chap => (
              <li key={chap.id} className={`p-2 rounded hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${chap.id === activeChapterId ? 'bg-gray-100' : ''}`} onClick={() => setActiveChapterId(chap.id)}>
                <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {chap.thumb ? <img src={chap.thumb} alt="thumb" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{chap.title}</div>
                </div>
                <div className="flex gap-1">
                  <button title="Xóa" onClick={e => { e.stopPropagation(); removeChapter(chap.id); }} className="text-xs text-red-500">xóa</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right: Reader / Editor */}
        <main className="col-span-3 bg-white p-6 rounded-lg shadow-sm">
          {/* Chapter header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <input
                value={activeChapter?.title ?? ''}
                onChange={e => updateChapter(activeChapter.id, { title: e.target.value })}
                className="text-xl font-semibold w-full border-b pb-2 focus:outline-none"
                placeholder="Tiêu đề chương..."
              />
              <div className="mt-2 text-sm text-gray-500">Chọn hình ảnh đại diện chương để hiển thị ở danh sách chương.</div>
            </div>
            <div className="w-32 text-right">
              <div className="text-xs text-gray-500">Số từ (ước lượng)</div>
              <div className="text-lg font-medium">{activeChapter?.content?.split(/\s+/).filter(Boolean).length ?? 0}</div>
            </div>
          </div>

          {/* Chapter thumbnail + editor */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <div className="w-full h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {activeChapter?.thumb ? (
                  <img src={activeChapter.thumb} alt="thumb" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-sm text-gray-400">Chưa có hình</div>
                )}
              </div>
              <div className="mt-2">
                <input type="file" accept="image/*" onChange={e => handleThumbChange(e, activeChapter.id)} />
              </div>
            </div>
            <div className="col-span-3">
              <textarea
                value={activeChapter?.content ?? ''}
                onChange={e => updateChapter(activeChapter.id, { content: e.target.value })}
                rows={12}
                className="w-full border rounded p-3 focus:outline-none"
                placeholder="Viết nội dung chương ở đây..."
              />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => alert('Lưu chương thành công (lưu cục bộ)')} className="px-3 py-1 rounded border">Lưu</button>
                <button onClick={() => navigator.clipboard?.writeText(activeChapter?.content ?? '')} className="px-3 py-1 rounded border">Sao chép nội dung</button>
              </div>
            </div>
          </div>

          {/* Reactions + Comments */}
          <div className="mt-6">
            <div className="flex items-center gap-4">
              {Object.keys(story.reactions).map(key => (
                <button key={key} onClick={() => react(key)} className="flex items-center gap-2 px-3 py-1 border rounded">
                  <span className="text-lg">{reactionMap[key]}</span>
                  <span className="text-sm">{story.reactions[key]}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold">Bình luận</h4>
              <div className="mt-3 grid grid-cols-3 gap-3 items-start">
                <input value={newCommentName} onChange={e => setNewCommentName(e.target.value)} placeholder="Tên (tuỳ chọn)" className="col-span-1 border rounded p-2" />
                <textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Viết bình luận..." className="col-span-2 border rounded p-2" />
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={addComment} className="px-3 py-1 rounded bg-blue-600 text-white">Gửi</button>
                <button onClick={() => { setNewCommentName(''); setNewCommentText(''); }} className="px-3 py-1 rounded border">Hủy</button>
              </div>

              <div className="mt-4 space-y-3">
                {story.comments.length === 0 ? <div className="text-sm text-gray-500">Chưa có bình luận nào.</div> : null}
                {story.comments.map(c => (
                  <div key={c.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-400">{new Date(c.date).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 text-sm">{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      <footer className="mt-6 text-sm text-gray-500">Trang demo: dữ liệu lưu cục bộ trên trình duyệt. Muốn xuất bản cần backend. ✨</footer>
    </div>
  );
}
