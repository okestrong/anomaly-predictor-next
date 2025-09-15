import { clsx, type ClassValue } from "clsx";

/**
 * Tailwind CSS 클래스를 조건부로 병합하는 유틸리티 함수
 * clsx를 기반으로 한 간편한 클래스명 병합
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}