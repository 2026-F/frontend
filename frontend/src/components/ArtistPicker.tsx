'use client';

// 작가 선택 컴포넌트
// - 이름으로 기존 작가를 검색해서 고르거나
// - 찾는 작가가 없으면 그 자리에서 바로 새 작가를 등록해서 고를 수 있게 해준다.
//
// 비유: 택배 보낼 때 주소록에서 수신자를 고르거나, 주소록에 없으면 그 자리에서
// 새 수신자를 추가해서 바로 쓰는 것과 같은 흐름입니다.

import { useEffect, useRef, useState } from 'react';
import { createArtist, errorMessage, fetchArtists } from '@/lib/api';
import type { Artist } from '@/types';

const isHttpUrl = (value: string) => {
  if (!value) return true; // 비워두는 건 허용
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const emptyNewArtist = {
  name: '',
  birthYear: '',
  nationality: '',
  biography: '',
  profileImageUrl: '',
};

export default function ArtistPicker({
  selectedArtistId,
  selectedArtistName,
  onSelect,
  onClear,
  disabled,
}: {
  selectedArtistId: number | null;
  selectedArtistName: string | null;
  onSelect: (artistId: number, artistName: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Artist[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [newArtist, setNewArtist] = useState(emptyNewArtist);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 검색은 타이핑할 때마다 바로 보내지 않고, 멈춘 지 400ms 뒤에 한 번만 보낸다 (디바운스).
  // searchTokenRef: 늦게 도착한 "옛날 검색" 응답이 최신 검색 결과를 덮어쓰지 않게 막는 번호표.
  const searchTokenRef = useRef(0);

  useEffect(() => {
    if (mode !== 'search' || !keyword.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const token = ++searchTokenRef.current;
    setSearching(true);
    const timer = setTimeout(() => {
      fetchArtists({ keyword: keyword.trim(), size: 10 })
        .then((page) => {
          if (searchTokenRef.current !== token) return; // 이미 더 최신 검색이 진행 중
          setResults(page.content);
          setSearchError(null);
        })
        .catch((cause) => {
          if (searchTokenRef.current !== token) return;
          setResults([]);
          setSearchError(errorMessage(cause, '작가를 검색하지 못했습니다.'));
        })
        .finally(() => {
          if (searchTokenRef.current === token) setSearching(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword, mode]);

  const submitNewArtist = async () => {
    const name = newArtist.name.trim();
    const nationality = newArtist.nationality.trim();
    const biography = newArtist.biography.trim();
    const profileImageUrl = newArtist.profileImageUrl.trim();
    const birthYear = newArtist.birthYear.trim() ? Number(newArtist.birthYear) : null;

    if (!name || name.length > 50) {
      setCreateError('작가 이름은 1~50자로 입력해 주세요.');
      return;
    }
    if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1000 || birthYear > 9999)) {
      setCreateError('출생연도는 1000~9999 사이 숫자로 입력해 주세요.');
      return;
    }
    if (nationality.length > 50 || biography.length > 2000 || profileImageUrl.length > 500) {
      setCreateError('국적은 50자, 소개는 2000자, 이미지 URL은 500자 이내로 입력해 주세요.');
      return;
    }
    if (!isHttpUrl(profileImageUrl)) {
      setCreateError('프로필 이미지 URL은 http:// 또는 https://로 시작해야 합니다.');
      return;
    }

    setCreateError(null);
    setCreating(true);
    try {
      const created = await createArtist({ name, biography, birthYear, nationality, profileImageUrl });
      onSelect(created.id, created.name);
      setNewArtist(emptyNewArtist);
      setMode('search');
    } catch (cause) {
      setCreateError(errorMessage(cause, '작가 등록에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setCreating(false);
    }
  };

  if (selectedArtistId && selectedArtistName) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-[8px] border border-[#dfe0da] bg-[#f7f8f4] px-3 py-3">
        <p className="text-[14px] font-semibold">{selectedArtistName}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-[13px] font-bold underline disabled:opacity-50"
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2 text-[13px] font-semibold">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`h-9 flex-1 rounded-[8px] border ${mode === 'search' ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#dfe0da]'}`}
        >
          기존 작가 검색
        </button>
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`h-9 flex-1 rounded-[8px] border ${mode === 'create' ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#dfe0da]'}`}
        >
          새 작가 등록
        </button>
      </div>

      {mode === 'search' ? (
        <div className="mt-3">
          <input
            type="text"
            placeholder="작가 이름으로 검색"
            value={keyword}
            disabled={disabled}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-12 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717]"
          />
          {searching && <p className="mt-2 text-[12px] text-[#73756f]">검색 중...</p>}
          {searchError && <p className="mt-2 text-[12px] text-[#c13b32]">{searchError}</p>}
          {!searching && keyword.trim() && results.length === 0 && !searchError && (
            <p className="mt-2 text-[12px] text-[#73756f]">
              검색 결과가 없습니다. 상단의 &apos;새 작가 등록&apos;을 눌러 새로 등록해 주세요.
            </p>
          )}
          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-[#eceee7] rounded-[8px] border border-[#dfe0da]">
              {results.map((artist) => (
                <li key={artist.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(artist.id, artist.name)}
                    className="flex min-h-11 w-full items-center justify-between px-3 text-left text-[14px] disabled:opacity-50"
                  >
                    <span>{artist.name}</span>
                    {artist.nationality && <span className="text-[12px] text-[#73756f]">{artist.nationality}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3 rounded-[12px] bg-[#f7f8f4] p-4">
          <div>
            <label className="block text-[13px] font-semibold">작가 이름 (필수)</label>
            <input
              type="text"
              maxLength={50}
              disabled={disabled || creating}
              value={newArtist.name}
              onChange={(event) => setNewArtist((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 h-11 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold">출생연도</label>
              <input
                type="number"
                disabled={disabled || creating}
                value={newArtist.birthYear}
                onChange={(event) => setNewArtist((prev) => ({ ...prev, birthYear: event.target.value }))}
                className="mt-1 h-11 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold">국적</label>
              <input
                type="text"
                maxLength={50}
                disabled={disabled || creating}
                value={newArtist.nationality}
                onChange={(event) => setNewArtist((prev) => ({ ...prev, nationality: event.target.value }))}
                className="mt-1 h-11 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold">작가 소개</label>
            <textarea
              rows={3}
              maxLength={2000}
              disabled={disabled || creating}
              value={newArtist.biography}
              onChange={(event) => setNewArtist((prev) => ({ ...prev, biography: event.target.value }))}
              className="mt-1 w-full resize-y rounded-[8px] border border-[#dfe0da] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#171717]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold">프로필 이미지 URL</label>
            <input
              type="text"
              maxLength={500}
              placeholder="https://example.com/artist.jpg"
              disabled={disabled || creating}
              value={newArtist.profileImageUrl}
              onChange={(event) => setNewArtist((prev) => ({ ...prev, profileImageUrl: event.target.value }))}
              className="mt-1 h-11 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717]"
            />
          </div>
          {createError && <p className="text-[13px] text-[#c13b32]">{createError}</p>}
          <button
            type="button"
            disabled={disabled || creating}
            onClick={submitNewArtist}
            className="h-11 w-full rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
          >
            {creating ? '등록 중...' : '작가 등록하고 선택'}
          </button>
        </div>
      )}
    </div>
  );
}
