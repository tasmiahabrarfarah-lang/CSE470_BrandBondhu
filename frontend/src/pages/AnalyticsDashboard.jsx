import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  // New competitor form
  const [compUrl, setCompUrl] = useState('');
  const [compName, setCompName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes, sentRes] = await Promise.all([
        api.analytics.getDashboardStats(),
        api.analytics.getCompetitors(),
        api.analytics.getSentimentAnalysis()
      ]);
      setStats(statsRes.data);
      setCompetitors(compRes.data);
      setSentiment(sentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncComments = async () => {
    try {
      await api.analytics.syncSentimentComments();
      const sentRes = await api.analytics.getSentimentAnalysis();
      setSentiment(sentRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!compUrl || !compName) return;
    try {
      await api.analytics.addCompetitor({ pageUrl: compUrl, name: compName });
      const compRes = await api.analytics.getCompetitors();
      setCompetitors(compRes.data);
      setCompUrl('');
      setCompName('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Analytics & Insights</h1>
      
      <div style={styles.tabs}>
        <button 
          style={activeTab === 'overview' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('overview')}
        >Overview</button>
        <button 
          style={activeTab === 'sentiment' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('sentiment')}
        >Sentiment Analysis</button>
        <button 
          style={activeTab === 'competitors' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('competitors')}
        >Competitor Tracking</button>
      </div>

      {activeTab === 'overview' && stats && (
        <div style={styles.section}>
          <h2>Dashboard Overview</h2>
          <div style={styles.cardGrid}>
            <div className="card glass" style={styles.card}>
              <h3>Avg Engagement Rate</h3>
              <p style={styles.statValue}>{stats.avgEngagementRate}%</p>
            </div>
            <div className="card glass" style={styles.card}>
              <h3>Captions Generated</h3>
              <p style={styles.statValue}>{stats.contentGeneration.captions}</p>
            </div>
            <div className="card glass" style={styles.card}>
              <h3>Posters Generated</h3>
              <p style={styles.statValue}>{stats.contentGeneration.posters}</p>
            </div>
          </div>
          <div className="card glass" style={{ marginTop: '20px', padding: '20px' }}>
            <h3>Follower Growth</h3>
            <ul style={styles.list}>
              {stats.followerGrowth.map((g, idx) => (
                <li key={idx} style={styles.listItem}>
                  <span>{g.month}</span> <span>{g.followers} followers</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sentiment' && sentiment && (
        <div style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Facebook Comment Sentiment</h2>
            <button className="btn btn-primary" onClick={handleSyncComments}>Sync Comments</button>
          </div>
          
          <div style={styles.cardGrid}>
            <div className="card glass" style={styles.card}>
              <h3>Total Comments</h3>
              <p style={styles.statValue}>{sentiment.trends.total}</p>
            </div>
            <div className="card glass" style={{ ...styles.card, borderColor: '#34d399' }}>
              <h3>Positive</h3>
              <p style={{ ...styles.statValue, color: '#34d399' }}>{sentiment.trends.positive}</p>
            </div>
            <div className="card glass" style={{ ...styles.card, borderColor: '#f87171' }}>
              <h3>Negative</h3>
              <p style={{ ...styles.statValue, color: '#f87171' }}>{sentiment.trends.negative}</p>
            </div>
          </div>

          <div className="card glass" style={{ marginTop: '20px', padding: '20px' }}>
            <h3>Recent Comments</h3>
            {sentiment.comments.map(c => (
              <div key={c._id} style={styles.commentBox}>
                <div style={styles.commentHeader}>
                  <span style={{ fontWeight: 'bold' }}>Platform: {c.platform}</span>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                    backgroundColor: c.sentiment === 'positive' ? '#065f46' : c.sentiment === 'negative' ? '#7f1d1d' : '#334155'
                  }}>
                    {c.sentiment.toUpperCase()}
                  </span>
                </div>
                <p>{c.content}</p>
                {c.isFlagged && (
                  <div style={styles.flaggedAlert}>
                    <strong>Flagged:</strong> Needs attention! 
                    <br/> <em>Suggested Reply:</em> {c.suggestedReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'competitors' && (
        <div style={styles.section}>
          <h2>Competitor Tracking</h2>
          <form onSubmit={handleAddCompetitor} style={styles.form}>
            <input 
              style={styles.input} 
              placeholder="Competitor Name" 
              value={compName} 
              onChange={e => setCompName(e.target.value)} 
              required
            />
            <input 
              style={styles.input} 
              placeholder="Facebook Page URL" 
              value={compUrl} 
              onChange={e => setCompUrl(e.target.value)} 
              required
            />
            <button type="submit" className="btn btn-primary">Track Competitor</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            {competitors.map(c => (
              <div key={c._id} className="card glass" style={{ ...styles.card, marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#818cf8' }}>{c.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '10px' }}>{c.pageUrl}</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div><strong>Followers:</strong> {c.metrics.followers}</div>
                  <div><strong>Engagement Rate:</strong> {c.metrics.engagementRate}%</div>
                  <div><strong>Posts/Week:</strong> {c.metrics.postingFrequency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', color: '#fff' },
  header: { fontSize: '2rem', marginBottom: '20px', fontWeight: 'bold' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { 
    padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.05)', 
    border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' 
  },
  activeTab: { 
    padding: '10px 20px', backgroundColor: '#6366f1', 
    border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' 
  },
  section: { animation: 'fadeIn 0.3s ease-out' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  card: { padding: '20px' },
  statValue: { fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0 0 0' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  commentBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  flaggedAlert: { marginTop: '10px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' },
  form: { display: 'flex', gap: '10px', alignItems: 'center' },
  input: { 
    padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', 
    backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', flex: 1 
  }
};
