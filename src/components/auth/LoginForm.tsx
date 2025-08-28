/**
 * Login Form Component
 * Secure authentication form with password validation
 */

import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.ts'
import { UserCredentials } from '../../types/note.ts'

interface LoginFormProps {
  readonly onSuccess?: () => void
  readonly showSignUp?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  showSignUp = true
}) => {
  const { authState, login, checkPasswordStrength } = useAuth()
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [credentials, setCredentials] = useState<UserCredentials>({
    username: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = checkPasswordStrength(credentials.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUpMode && credentials.password !== confirmPassword) {
      return
    }

    if (isSignUpMode && !passwordStrength.isStrong) {
      return
    }

    try {
      await login(credentials)
      onSuccess?.()
    } catch (error) {
      // Error handling is managed by the useAuth hook
    }
  }

  const handleInputChange = (field: keyof UserCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    if (!credentials.username.trim() || !credentials.password) {
      return false
    }

    if (isSignUpMode) {
      return passwordStrength.isStrong && credentials.password === confirmPassword
    }

    return true
  }

  const getPasswordStrengthColor = (score: number): string => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    if (score >= 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPasswordStrengthText = (score: number): string => {
    if (score >= 4) return 'Very Strong'
    if (score >= 3) return 'Strong'
    if (score >= 2) return 'Moderate'
    if (score >= 1) return 'Weak'
    return 'Very Weak'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-kelly-green rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-base-content">
            {isSignUpMode ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-base-content/70">
            {isSignUpMode 
              ? 'Create a secure account to protect your notes' 
              : 'Access your encrypted notes securely'
            }
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-base-content">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="input input-bordered w-full mt-1"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={authState.isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                  required
                  className="input input-bordered w-full pr-10"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={authState.isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Password strength indicator (sign up mode only) */}
              {isSignUpMode && credentials.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-content/70">Password strength:</span>
                    <span className={`font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="mt-1 flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < passwordStrength.score 
                            ? passwordStrength.score >= 3 ? 'bg-green-500' : 'bg-yellow-500'
                            : 'bg-base-300'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-1 text-xs text-base-content/60">
                      {passwordStrength.feedback.map((feedback, i) => (
                        <li key={i}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password (sign up mode only) */}
            {isSignUpMode && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-base-content">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input input-bordered w-full mt-1 ${
                    confirmPassword && credentials.password !== confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={authState.isLoading}
                />
                {confirmPassword && credentials.password !== confirmPassword && (
                  <p className="mt-1 text-sm text-error">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {authState.error && (
            <div className="alert alert-error">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{authState.error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFormValid() || authState.isLoading}
            className="btn btn-primary w-full"
          >
            {authState.isLoading && <div className="loading loading-spinner loading-xs mr-2" />}
            {isSignUpMode ? 'Create Account' : 'Sign In'}
          </button>

          {/* Mode toggle */}
          {showSignUp && (
            <div className="text-center">
              <button
                type="button"
                className="link link-primary text-sm"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode)
                  setConfirmPassword('')
                }}
                disabled={authState.isLoading}
              >
                {isSignUpMode 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Create one'
                }
              </button>
            </div>
          )}

          {/* Security notice */}
          <div className="text-center text-xs text-base-content/60 bg-base-100 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-4 h-4 text-kelly-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">End-to-End Encrypted</span>
            </div>
            <p>
              Your notes are encrypted locally with your password. 
              We cannot recover your data if you forget your password.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}