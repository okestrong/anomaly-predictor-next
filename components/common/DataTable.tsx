'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

export interface DataTableColumn {
  key: string
  title: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, row: any) => string
}

interface DataTableProps<T = any> {
  data: T[]
  columns: DataTableColumn[]
  loading?: boolean
  loadingText?: string
  emptyText?: string
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  paginate?: boolean
  pageSize?: number
  rowKey?: string | ((row: T, index: number) => string)
  hasRowActions?: boolean
  className?: string
  children?: React.ReactNode
  header?: React.ReactNode
  actions?: React.ReactNode
  empty?: React.ReactNode
  onSelectionChange?: (selectedRows: string[]) => void
  onSortChange?: (sortKey: string, sortOrder: 'asc' | 'desc') => void
  renderCell?: (key: string, row: T, value: any, index: number) => React.ReactNode
  renderRowActions?: (row: T, index: number) => React.ReactNode
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  loadingText = '데이터를 불러오는 중...',
  emptyText = '데이터가 없습니다.',
  searchable = false,
  searchPlaceholder = '검색...',
  selectable = false,
  paginate = true,
  pageSize = 10,
  rowKey = 'id',
  hasRowActions = false,
  className,
  header,
  actions,
  empty,
  onSelectionChange,
  onSortChange,
  renderCell,
  renderRowActions
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const getNestedValue = useCallback((obj: any, path: string) => {
    return path.split('.').reduce((o, p) => o?.[p], obj)
  }, [])

  const getRowKey = useCallback((row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index)
    }
    return String(getNestedValue(row, rowKey) ?? index)
  }, [rowKey, getNestedValue])

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery) {
      return data
    }
    
    const query = searchQuery.toLowerCase()
    return data.filter(row => {
      return columns.some(column => {
        const value = getNestedValue(row, column.key)
        return String(value).toLowerCase().includes(query)
      })
    })
  }, [data, searchable, searchQuery, columns, getNestedValue])

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return filteredData
    }
    
    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey)
      const bVal = getNestedValue(b, sortKey)
      
      let result = 0
      if (aVal < bVal) result = -1
      else if (aVal > bVal) result = 1
      
      return sortOrder === 'desc' ? -result : result
    })
  }, [filteredData, sortKey, sortOrder, getNestedValue])

  const totalPages = useMemo(() => {
    if (!paginate) return 1
    return Math.ceil(filteredData.length / pageSize)
  }, [paginate, filteredData.length, pageSize])

  const paginatedData = useMemo(() => {
    if (!paginate) return sortedData
    
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedData.slice(start, end)
  }, [paginate, sortedData, currentPage, pageSize])

  const startItem = useMemo(() => {
    return (currentPage - 1) * pageSize + 1
  }, [currentPage, pageSize])

  const endItem = useMemo(() => {
    return Math.min(currentPage * pageSize, filteredData.length)
  }, [currentPage, pageSize, filteredData.length])

  const selectAll = useMemo(() => {
    return selectedRows.length === filteredData.length && filteredData.length > 0
  }, [selectedRows.length, filteredData.length])

  const indeterminate = useMemo(() => {
    return selectedRows.length > 0 && selectedRows.length < filteredData.length
  }, [selectedRows.length, filteredData.length])

  const totalColumns = useMemo(() => {
    let count = columns.length
    if (selectable) count++
    if (hasRowActions) count++
    return count
  }, [columns.length, selectable, hasRowActions])

  const formatCellValue = useCallback((row: T, column: DataTableColumn) => {
    const value = getNestedValue(row, column.key)
    if (column.formatter) {
      return column.formatter(value, row)
    }
    return value ?? ''
  }, [getNestedValue])

  const handleSort = useCallback((key: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc'
    
    if (sortKey === key) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }
    
    setSortKey(key)
    setSortOrder(newSortOrder)
    onSortChange?.(key, newSortOrder)
  }, [sortKey, sortOrder, onSortChange])

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredData.map((row, index) => getRowKey(row, index)))
    }
  }, [selectAll, filteredData, getRowKey])

  const handleRowSelection = useCallback((rowKey: string, checked: boolean) => {
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, rowKey]
      } else {
        return prev.filter(key => key !== rowKey)
      }
    })
  }, [])

  const getRowClasses = useCallback((row: T, index: number) => {
    const key = getRowKey(row, index)
    return selectedRows.includes(key) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
  }, [selectedRows, getRowKey])

  useEffect(() => {
    onSelectionChange?.(selectedRows)
  }, [selectedRows, onSelectionChange])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    const checkbox = document.querySelector('[data-indeterminate="true"]') as HTMLInputElement
    if (checkbox) {
      checkbox.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <div className={cn('overflow-hidden', className)}>
      {/* 테이블 헤더 */}
      {(header || searchable || actions) && (
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between space-x-4">
            {/* 왼쪽: 제목 및 설명 */}
            {header && <div>{header}</div>}
            
            {/* 오른쪽: 검색 및 액션 */}
            <div className="flex items-center space-x-4">
              {/* 검색 */}
              {searchable && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="block w-80 pl-10 pr-3 py-2 
                             border border-gray-300 dark:border-gray-600 
                             rounded-md bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-white
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}
              
              {/* 액션 */}
              {actions && <div>{actions}</div>}
            </div>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* 테이블 헤더 */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {/* 선택 체크박스 */}
              {selectable && (
                <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    data-indeterminate={indeterminate}
                    onChange={handleSelectAll}
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 
                             rounded border-gray-300 text-primary-600 
                             focus:ring-primary-500"
                  />
                </th>
              )}
              
              {/* 컬럼 헤더 */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200',
                    column.width && `w-${column.width}`
                  )}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={cn(
                            'w-3 h-3',
                            sortKey === column.key && sortOrder === 'asc' 
                              ? 'text-primary-600' 
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDownIcon 
                          className={cn(
                            'w-3 h-3 -mt-1',
                            sortKey === column.key && sortOrder === 'desc' 
                              ? 'text-primary-600' 
                              : 'text-gray-400'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              
              {/* 액션 컬럼 */}
              {hasRowActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          
          {/* 테이블 바디 */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {/* 로딩 상태 */}
            {loading && (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center">
                  <LoadingSpinner variant="neural" text={loadingText} />
                </td>
              </tr>
            )}
            
            {/* 데이터 없음 */}
            {!loading && !filteredData.length && (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    {empty || emptyText}
                  </div>
                </td>
              </tr>
            )}
            
            {/* 데이터 행 */}
            {!loading && paginatedData.map((row, index) => {
              const key = getRowKey(row, index)
              return (
                <tr 
                  key={key}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    getRowClasses(row, index)
                  )}
                >
                  {/* 선택 체크박스 */}
                  {selectable && (
                    <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(key)}
                        onChange={(e) => handleRowSelection(key, e.target.checked)}
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 
                                 rounded border-gray-300 text-primary-600 
                                 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  
                  {/* 데이터 셀 */}
                  {columns.map((column) => {
                    const value = getNestedValue(row, column.key)
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 whitespace-nowrap text-sm',
                          column.align === 'center' 
                            ? 'text-center' 
                            : column.align === 'right' 
                            ? 'text-right' 
                            : 'text-left'
                        )}
                      >
                        {renderCell ? renderCell(column.key, row, value, index) : formatCellValue(row, column)}
                      </td>
                    )
                  })}
                  
                  {/* 행 액션 */}
                  {hasRowActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderRowActions?.(row, index)}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {paginate && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              총 {filteredData.length}개 중 {startItem}-{endItem}개 표시
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1 text-sm rounded-md 
                         border border-gray-300 dark:border-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300"
              >
                이전
              </button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1 text-sm rounded-md 
                         border border-gray-300 dark:border-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}