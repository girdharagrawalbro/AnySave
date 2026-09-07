from django.urls import path

from . import views

urlpatterns = [
    path('resolve/', views.ResolveView.as_view()),
    path('stream/', views.StreamView.as_view()),
    path('download/', views.StartDownloadView.as_view()),
    path('jobs/', views.JobListView.as_view()),
    path('jobs/<int:job_id>/status/', views.JobStatusView.as_view()),
    path('jobs/<int:job_id>/', views.JobStatusView.as_view()),
]
