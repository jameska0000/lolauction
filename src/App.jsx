import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

const teamLeaders = ['강신형', '윤광현', '김동욱', '박현호'];
const allUsers = [...teamLeaders, '이재혁', '게스트'];

const initialPlayers = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `선수${i + 1}`,
  position: `포지션${i + 1}`,
  profile: `선수${i + 1}의 프로필 내용입니다. 이 선수는 경기에 중요한 역할을 합니다.`,
  image: '',  // 이미지가 없다면 빈 문자열로 표시
  tier: `티어${i + 1}`,
  price: 0,
  assignedTo: null,
}));

const initialBudgets = teamLeaders.reduce((acc, name) => {
  acc[name] = { budget: 3000, players: [] };
  return acc;
}, {});

function AuctionApp() {
  const [players, setPlayers] = useState(initialPlayers);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [loggedInLeader, setLoggedInLeader] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAuction, setCurrentAuction] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);

  const startAuction = () => {
    const available = players.filter(p => !p.assignedTo);
    if (available.length === 0) return alert('모든 선수가 낙찰되었습니다.');
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentAuction(random);
    setCurrentBid(0);
    setHighestBidder('');
    setTimeLeft(20);
    setIsPaused(false);
  };

  useEffect(() => {
    if (isPaused || timeLeft === 0 || !currentAuction) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, isPaused]);

  const handleBid = () => {
    const myBudget = budgets[loggedInLeader]?.budget || 0;
    if (currentBid <= 0 || currentBid > myBudget) return alert('입찰 금액 오류');
    setHighestBidder(loggedInLeader);
    setTimeLeft(20);
  };

  const handleFinalize = () => {
    if (!currentAuction || !highestBidder) return;
    setHistory([...history, {
      auction: currentAuction,
      bidder: highestBidder,
      bid: currentBid
    }]);
    const updatedPlayers = players.map(p =>
      p.id === currentAuction.id ? { ...p, price: currentBid, assignedTo: highestBidder } : p
    );
    const updatedBudgets = {
      ...budgets,
      [highestBidder]: {
        budget: budgets[highestBidder].budget - currentBid,
        players: [...budgets[highestBidder].players, currentAuction.id]
      }
    };
    setPlayers(updatedPlayers);
    setBudgets(updatedBudgets);
    setCurrentAuction(null);
    setCurrentBid(0);
    setHighestBidder('');
    setTimeLeft(0);
  };

  const handleUndoAuction = () => {
    const last = history[history.length - 1];
    if (!last) return alert('되돌릴 경매가 없습니다.');
    const updatedPlayers = players.map(p =>
      p.id === last.auction.id ? { ...p, assignedTo: null, price: 0 } : p
    );
    const updatedBudgets = {
      ...budgets,
      [last.bidder]: {
        budget: budgets[last.bidder].budget + last.bid,
        players: budgets[last.bidder].players.filter(id => id !== last.auction.id),
      },
    };
    setPlayers(updatedPlayers);
    setBudgets(updatedBudgets);
    setHistory(history.slice(0, -1));
  };

  const saveProfile = () => {
    setPlayers(players.map(p => p.id === editedProfile.id ? { ...editedProfile } : p));
    setViewProfile(editedProfile);
    setIsEditing(false);
  };

  const resetAll = () => {
    if (window.confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
      setPlayers(players.map(player => ({
        ...player,
        price: 0,
        assignedTo: null,
      })));  // 선수 프로필은 그대로 두고, 가격과 낙찰된 팀을 초기화
      setBudgets(initialBudgets);  // 예산 초기화
      setCurrentAuction(null);
      setCurrentBid(0);
      setHighestBidder('');
      setTimeLeft(0);
      setIsPaused(false);
      setViewProfile(null);
      setIsEditing(false);
      setEditedProfile(null);
      setHistory([]);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <h2 className="text-xl font-bold mb-4">로그인</h2>
        <select
          className="w-full border rounded p-2 mb-2"
          onChange={e => setLoggedInLeader(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>사용자 선택</option>
          {allUsers.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {loggedInLeader !== '게스트' && (
          <input
            type="password"
            className="w-full border rounded p-2 mb-2"
            placeholder="비밀번호 입력"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}
        <Button
          className="w-full"
          onClick={() => {
            if (!loggedInLeader) return alert('사용자를 선택하세요');
            if (loggedInLeader === '게스트' || password === '8751') {
              setIsLoggedIn(true);
            } else {
              alert('비밀번호가 틀렸습니다.');
            }
          }}
        >
          로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">환영합니다, {loggedInLeader}</h2>
        {loggedInLeader === '이재혁' && (
          <div className="flex gap-2">
            <Button onClick={startAuction}>무작위 선수 경매 시작</Button>
            <Button onClick={() => setIsPaused(prev => !prev)}>{isPaused ? '재개' : '일시정지'}</Button>
            <Button onClick={handleUndoAuction}>되돌리기</Button>
            <Button onClick={resetAll}>초기화</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">경매 선수</h3>
          {currentAuction ? (
            <Card>
              <CardContent>
                <p>{currentAuction.name}</p>
                <p>입찰가: {currentBid}원</p>
                <p>남은 시간: {timeLeft}초</p>
                <p>프로필: {currentAuction.profile || '정보 없음'}</p> {/* 프로필이 비어있으면 "정보 없음" 표시 */}
                {loggedInLeader !== '게스트' && (
                  <div className="flex gap-2 mt-2">
                    <Input type="number" value={currentBid} onChange={e => setCurrentBid(parseInt(e.target.value))} />
                    <Button onClick={handleBid}>입찰</Button>
                    {highestBidder === loggedInLeader && <Button onClick={handleFinalize}>낙찰</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p>진행 중인 경매가 없습니다.</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">내 팀 정보</h3>
          {budgets[loggedInLeader] && (
            <Card>
              <CardContent>
                <p>잔여 예산: {budgets[loggedInLeader].budget}원</p>
                <p>선수 수: {budgets[loggedInLeader].players.length}명</p>
                <ul className="mt-2 list-disc list-inside">
                  {budgets[loggedInLeader].players.map(id => {
                    const player = players.find(p => p.id === id);
                    return (
                      <li key={id}>
                        {player?.name}
                        <br />
                        {player?.profile || '프로필 정보 없음'} {/* 비어있는 프로필 정보 표시 */}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuctionApp;
