import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, Video, Zap, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

interface TrendingTopic {
  id: string;
  title: string;
  searchVolume: number;
  trend: "up" | "down" | "stable";
  category: string;
  relatedTopics: string[];
  predictedGrowth: number;
}

interface TrendingVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  hookFormula: string;
  scriptStructure: string;
  visualStyle: string;
  musicGenre: string;
}

export default function TrendResearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("topics");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingTopics] = useState<TrendingTopic[]>([
    {
      id: "1",
      title: "AI Video Generation",
      searchVolume: 125000,
      trend: "up",
      category: "Technology",
      relatedTopics: ["Automation", "Content Creation", "AI Tools"],
      predictedGrowth: 45,
    },
    {
      id: "2",
      title: "Faceless YouTube Channels",
      searchVolume: 98000,
      trend: "up",
      category: "Content Creation",
      relatedTopics: ["Passive Income", "Automation", "YouTube"],
      predictedGrowth: 38,
    },
    {
      id: "3",
      title: "Stock Market Analysis",
      searchVolume: 87000,
      trend: "stable",
      category: "Finance",
      relatedTopics: ["Trading", "Investing", "Crypto"],
      predictedGrowth: 12,
    },
    {
      id: "4",
      title: "Motivational Quotes",
      searchVolume: 156000,
      trend: "up",
      category: "Lifestyle",
      relatedTopics: ["Self-improvement", "Inspiration", "Success"],
      predictedGrowth: 28,
    },
    {
      id: "5",
      title: "Productivity Tips",
      searchVolume: 94000,
      trend: "down",
      category: "Lifestyle",
      relatedTopics: ["Time Management", "Habits", "Success"],
      predictedGrowth: -5,
    },
  ]);

  const [trendingVideos] = useState<TrendingVideo[]>([
    {
      id: "1",
      title: "How AI is Changing Everything in 2024",
      channel: "Tech Insider",
      views: 2500000,
      likes: 125000,
      comments: 45000,
      engagementRate: 6.8,
      hookFormula: "Shocking statistic + Problem statement",
      scriptStructure: "Hook → Problem → Solution → Call to Action",
      visualStyle: "Fast cuts with B-roll + Text overlays",
      musicGenre: "Upbeat electronic",
    },
    {
      id: "2",
      title: "Make $10k/Month with Faceless Videos",
      channel: "Passive Income Hub",
      views: 1800000,
      likes: 98000,
      comments: 32000,
      engagementRate: 7.2,
      hookFormula: "Money promise + Social proof",
      scriptStructure: "Hook → Story → Method → Results → CTA",
      visualStyle: "Animated graphics + Success stories",
      musicGenre: "Motivational background music",
    },
    {
      id: "3",
      title: "5 Habits of Millionaires",
      channel: "Success Stories",
      views: 3200000,
      likes: 156000,
      comments: 52000,
      engagementRate: 6.5,
      hookFormula: "Curiosity gap + List format",
      scriptStructure: "Hook → 5 Habits → Conclusion → CTA",
      visualStyle: "Cinematic shots + Text animations",
      musicGenre: "Inspirational orchestral",
    },
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Found trends for "${searchQuery}"`);
    } catch (error) {
      toast.error("Failed to search trends");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTrends = () => {
    toast.success("Trends exported to CSV");
  };

  const handleAnalyzeVideo = (videoId: string) => {
    toast.success("Video analysis saved to your library");
  };

  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-600" />
          <h1 className="text-3xl font-bold text-white">Trend Research</h1>
        </div>
        <p className="text-slate-400">
          Discover trending topics and analyze successful videos to optimize your content strategy
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search trends (e.g., 'AI video generation', 'faceless channels')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border-slate-800">
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending Topics
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Trending Videos
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Trending Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Top Trending Topics</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTrends}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="grid gap-4">
            {trendingTopics.map((topic) => (
              <Card key={topic.id} className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{topic.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-slate-800">
                          {topic.category}
                        </Badge>
                        <Badge
                          className={
                            topic.trend === "up"
                              ? "bg-green-500/20 text-green-400"
                              : topic.trend === "down"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                          }
                        >
                          {topic.trend === "up" ? "📈" : topic.trend === "down" ? "📉" : "→"} {topic.trend}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">
                        {(topic.searchVolume / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-slate-400">searches/month</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Growth Prediction</div>
                      <div className="text-lg font-semibold text-white">
                        {topic.predictedGrowth > 0 ? "+" : ""}{topic.predictedGrowth}%
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Related Topics</div>
                      <div className="text-sm text-slate-300">{topic.relatedTopics.length} topics</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {topic.relatedTopics.map((related) => (
                      <Badge key={related} variant="outline" className="text-xs">
                        {related}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                    Use This Topic
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trending Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Analyze Successful Videos</h2>

          <div className="grid gap-4">
            {trendingVideos.map((video) => (
              <Card key={video.id} className="border-slate-800 bg-slate-900/50">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{video.title}</h3>
                    <p className="text-sm text-slate-400">{video.channel}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Views</div>
                      <div className="text-lg font-semibold text-white">
                        {(video.views / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Likes</div>
                      <div className="text-lg font-semibold text-white">
                        {(video.likes / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Comments</div>
                      <div className="text-lg font-semibold text-white">
                        {(video.comments / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Engagement</div>
                      <div className="text-lg font-semibold text-amber-600">{video.engagementRate}%</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-300 mb-1">Hook Formula</div>
                      <div className="text-sm text-slate-200">{video.hookFormula}</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-300 mb-1">Script Structure</div>
                      <div className="text-sm text-slate-200">{video.scriptStructure}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-300 mb-1">Visual Style</div>
                        <div className="text-sm text-slate-200">{video.visualStyle}</div>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-300 mb-1">Music Genre</div>
                        <div className="text-sm text-slate-200">{video.musicGenre}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAnalyzeVideo(video.id)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Apply This Formula
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Content Performance Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Most Effective Hook Formulas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Problem + Solution</span>
                  <span className="text-sm font-semibold text-amber-600">8.2% engagement</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Money Promise</span>
                  <span className="text-sm font-semibold text-amber-600">7.8% engagement</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Curiosity Gap</span>
                  <span className="text-sm font-semibold text-amber-600">7.1% engagement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Top Performing Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Self-improvement</span>
                  <span className="text-sm font-semibold text-green-500">↑ 45%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Technology</span>
                  <span className="text-sm font-semibold text-green-500">↑ 38%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-sm text-slate-300">Finance</span>
                  <span className="text-sm font-semibold text-green-500">↑ 28%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}
