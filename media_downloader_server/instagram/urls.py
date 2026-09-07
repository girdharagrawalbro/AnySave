from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view()),
    path('login-with-cookies/', views.LoginWithCookiesView.as_view()),
    path('logout/', views.LogoutView.as_view()),
    path('status/', views.StatusView.as_view()),
    path('following/', views.FollowingView.as_view()),
    path('profile/<str:username>/posts/', views.ProfilePostsView.as_view()),
    path('save/', views.SaveView.as_view()),
]
