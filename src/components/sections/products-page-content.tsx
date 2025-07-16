'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/common/product-card'
import { useDebounce } from '@/hooks/use-debounce'
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from '@/lib/constants/sample-data'
import { ANIMATIONS } from '@/lib/constants'
import type { Product } from '@/types'

type SortOption = 'name' | 'price-low' | 'price-high' | 'newest' | 'popular'
type ViewMode = 'grid' | 'list'

export function ProductsPageContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = SAMPLE_PRODUCTS.filter(product => product.isActive)

    // Filter by search query
    if (debouncedSearch) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.category.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category.id === selectedCategory)
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'popular':
        default:
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
      }
    })

    return filtered
  }, [debouncedSearch, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-gradient-background pt-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="text-gradient">Premium Gaming Tools</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our complete collection of gaming enhancement tools. 
            All products include anti-ban protection, regular updates, and 24/7 support.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 h-12">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SAMPLE_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-48 h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-12 w-12"
              >
                <Grid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-12 w-12"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== 'all' || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('all')}>
                  {SAMPLE_CATEGORIES.find(c => c.id === selectedCategory)?.name} ×
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                  Search: "{searchQuery}" ×
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center mb-6"
        >
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {SAMPLE_PRODUCTS.length} products
          </p>
        </motion.div>

        {/* Products Grid/List */}
        <motion.div
          variants={ANIMATIONS.transitions.stagger}
          initial="initial"
          animate="animate"
          className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
          } mb-12`}
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full text-center py-12"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                variant="outline"
              >
                Clear all filters
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
