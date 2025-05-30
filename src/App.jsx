import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';

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

// 예산을 1111 포인트로 수정
const initialBudgets = teamLeaders.reduce((acc, name) => {
  acc[name] = { budget: 1111, players: [] }; // 1111 포인트로 수정
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
  const [history, setHistory] = useState([]);
  const [viewProfile, setViewProfile] = useState(null); // 클릭한 선수 프로필 보기
  const [isEditing, setIsEditing] = useState(false); // 수정 여부
  const [editedProfile, setEditedProfile] = useState(null); // 수정된 프로필
  const timerRef = useRef(null);

  // 경매 진행을 위한 함수
  const startAuction = () => {
    if (loggedInLeader !== '이재혁') return alert('경매 진행 권한이 없습니다. 이재혁만 진행할 수 있습니다.');

    const available = players.filter(p => !p.assignedTo);
    if (available.length === 0) return alert('모든 선수가 낙찰되었습니다.');
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentAuction(random);
    setCurrentBid(0);
    setHighestBidder('');
    setTimeLeft(20); // 경매 시간 20초로 설정
    setIsPaused(false);
  };

  useEffect(() => {
    if (isPaused || timeLeft === 0 || !currentAuction) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, isPaused]);

  // 입찰 처리
  const handleBid = () => {
    if (loggedInLeader === '이재혁') return alert('이재혁은 입찰할 수 없습니다.');

    const myBudget = budgets[loggedInLeader]?.budget || 0;
    if (currentBid <= 0 || currentBid > myBudget) return alert('입찰 금액 오류');
    setHighestBidder(loggedInLeader);
    setTimeLeft(20); // 경매 시간 초기화
  };

  // 낙찰 처리
  const handleFinalize = () => {
    if (!currentAuction || !highestBidder) return;
    
    // 경매 기록 저장
    setHistory([...history, {
      auction: currentAuction,
      bidder: highestBidder,
      bid: currentBid
    }]);
    
    // 선수 소속 변경
    const updatedPlayers = players.map(p =>
      p.id === currentAuction.id ? { ...p, price: currentBid, assignedTo: highestBidder } : p
    );

    // 예산 차감 및 팀에 선수 추가
    const updatedBudgets = {
      ...budgets,
      [highestBidder]: {
        budget: budgets[highestBidder].budget - currentBid, // 예산 차감
        players: [...budgets[highestBidder].players, currentAuction.id] // 해당 팀에 선수 추가
      }
    };

    // 상태 갱신
    setPlayers(updatedPlayers);
    setBudgets(updatedBudgets);
    setCurrentAuction(null);
    setCurrentBid(0);
    setHighestBidder('');
    setTimeLeft(0);
  };

  // 프로필 수정 페이지
  const handleEditProfile = (player) => {
    setEditedProfile(player);
    setIsEditing(true);
  };

  // 프로필 수정 저장
  const saveProfile = () => {
    setPlayers(players.map(p => p.id === editedProfile.id ? { ...editedProfile } : p));
    setViewProfile(editedProfile);
    setIsEditing(false);
  };

  // 프로필 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(null);
  };

  // 초기화 기능
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
            <Button onClick={resetAll}>초기화</Button>
          </div>
        )}
      </div>

      {/* 선수 목록 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {teamLeaders.map(name => (
          <div key={name} className="p-4 border rounded">
            <h3 className="font-semibold mb-2">{name}</h3>
            <p>잔여 예산: {budgets[name].budget}P</p>
            <p>선수 수: {budgets[name].players.length}명</p>
            <ul className="text-sm mt-2 list-disc list-inside">
              {budgets[name].players.map(id => {
                const player = players.find(p => p.id === id);
                return (
                  <li key={id}>
                    {player?.name}
                    <br />
                    {player?.profile || '프로필 정보 없음'}
                    <Button onClick={() => setViewProfile(player)}>보기</Button> {/* 보기 버튼 */}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 선수 프로필 보기 / 수정 */}
      {viewProfile && !isEditing && (
        <div className="mb-4">
          <h2>선수 프로필 보기</h2>
          <p>이름: {viewProfile.name}</p>
          <p>포지션: {viewProfile.position}</p>
          <p>티어: {viewProfile.tier}</p>
          <p>프로필: {viewProfile.profile}</p>
          <Button onClick={() => handleEditProfile(viewProfile)}>수정</Button>
        </div>
      )}

      {/* 프로필 수정 모드 */}
      {isEditing && editedProfile && (
        <div className="mb-4">
          <h2>선수 프로필 수정</h2>
          <Input
            value={editedProfile?.position}
            onChange={(e) => setEditedProfile({ ...editedProfile, position: e.target.value })}
            placeholder="포지션"
          />
          <Input
            value={editedProfile?.tier}
            onChange={(e) => setEditedProfile({ ...editedProfile, tier: e.target.value })}
            placeholder="티어"
          />
          <textarea
            value={editedProfile?.profile}
            onChange={(e) => setEditedProfile({ ...editedProfile, profile: e.target.value })}
            placeholder="선수 프로필"
          />
          <Button onClick={saveProfile}>저장</Button>
          <Button onClick={handleCancelEdit}>취소</Button>
        </div>
      )}

      {/* 경매 진행 부분 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">경매 선수</h3>
          {currentAuction ? (
            <Card>
              <CardContent>
                <p>{currentAuction.name}</p>
                <p>입찰가: {currentBid}원</p>
                <p>남은 시간: {timeLeft}초</p>
                <p>프로필: {currentAuction.profile || '정보 없음'}</p>
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
      </div>
    </div>
  );
}

export default AuctionApp;
