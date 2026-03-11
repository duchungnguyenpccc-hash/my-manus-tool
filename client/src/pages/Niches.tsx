import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Niches() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch niches
  const { data: niches = [], isLoading } = trpc.niche.list.useQuery();

  // Filter niches based on search
  const filteredNiches = niches.filter(
    (niche) =>
      niche.nicheName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      niche.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Niches</h1>
            <p className="text-muted-foreground">Manage your content niches and strategies</p>
          </div>
          <Link href="/niches/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Niche
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Input
          placeholder="Search niches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        {/* Niches Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading niches...</p>
          </div>
        ) : filteredNiches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No niches yet</p>
              <Link href="/niches/create">
                <Button>Create Your First Niche</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNiches.map((niche) => (
              <Card key={niche.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{niche.nicheName}</CardTitle>
                      <CardDescription>{niche.category}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/niches/${niche.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {niche.description && (
                      <p className="text-sm text-muted-foreground">{niche.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Channels</p>
                        <p className="font-semibold">{(niche as any).channelCount || 0}</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="font-semibold">{((niche as any).totalViews || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Avg CTR</p>
                        <p className="font-semibold">{((niche as any).avgCTR || 0).toFixed(2)}%</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">${((niche as any).totalRevenue || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
