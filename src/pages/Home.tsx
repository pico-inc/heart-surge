import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Accessibility, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">ハートサージ</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            障害を持つ人たちがつながり、経験を共有し、サポートを受けることができるコミュニティに参加しましょう。
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            コミュニティに参加する
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">なぜコミュニティに参加するのか？</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="h-10 w-10 text-indigo-600" />}
              title="つながり"
              description="障害を持つ人たちがつながり、経験を共有し、サポートを受けることができるコミュニティに参加しましょう。"
            />
            <FeatureCard
              icon={<MessageCircle className="h-10 w-10 text-indigo-600" />}
              title="安全なコミュニケーション"
              description="セキュアな環境で、個人の会話やグループディスカッションを行いましょう。"
            />
            <FeatureCard
              icon={<Accessibility className="h-10 w-10 text-indigo-600" />}
              title="リソースの共有"
              description="障害を持つ人たちがつながり、経験を共有し、サポートを受けることができるコミュニティに参加しましょう。"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-indigo-600" />}
              title="プライバシーを尊重"
              description="プライバシーとセキュリティを尊重しましょう。"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
