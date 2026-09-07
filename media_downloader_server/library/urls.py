from django.urls import path

from . import views

urlpatterns = [
    path('', views.LibraryView.as_view()),
    path('<int:item_id>/', views.LibraryItemView.as_view()),
]
