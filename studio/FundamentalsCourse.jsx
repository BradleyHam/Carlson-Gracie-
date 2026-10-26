import React from 'react';
import {TextInput} from '@sanity/ui';
import {defineType, defineField, set, unset, useFormValue} from 'sanity';
import {academyIds} from '../cms/timetables.js';
import {courseDays, courseDefaults, validateCourse, courseDateRange, courseTime} from '../cms/fundamentals.js';

function CourseTimeInput(props) {
  return <TextInput {...props.elementProps} type="time" value={props.value || ''} readOnly={props.readOnly}
    onChange={event=>props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}/>;
}
function CourseSummary() {
  const course = useFormValue([]);
  const valid = validateCourse(course);
  return <div style={{padding:16,border:'1px solid var(--card-border-color)',borderRadius:6,lineHeight:1.6,fontSize:14}}>
    <strong>What visitors will see</strong>
    {valid === true ? <>
      <p>{course.title || 'Fundamentals Course'}*<br/>{course.days.join(' & ')} · {courseTime(course)}<br/>{courseDateRange(course)}</p>
      <p>* Runs in blocks of {course.weeks} weeks.</p>
      <p>Publish once to show this block on the homepage, the academy page and the main timetable. It disappears after the final class. For the next block, create a new course or duplicate this one and change the starting date.</p>
    </> : <p>{valid} The finish date and six-week note are calculated for you.</p>}
  </div>;
}

export const fundamentalsCourse = defineType({
  name:'fundamentalsCourse',title:'Fundamentals course',type:'document',initialValue:courseDefaults,
  validation:rule=>rule.custom(value=>validateCourse(value)),
  fields:[
    defineField({name:'startDate',title:'First class date',type:'date',description:'Choose the exact date of the first class. It must match one of the class days below.',validation:rule=>rule.required()}),
    defineField({name:'days',title:'Class days',type:'array',of:[{type:'string'}],options:{list:courseDays,layout:'grid'},validation:rule=>rule.required().min(1).unique()}),
    defineField({name:'startTime',title:'Starts at',type:'string',components:{input:CourseTimeInput},validation:rule=>rule.required()}),
    defineField({name:'endTime',title:'Finishes at',type:'string',components:{input:CourseTimeInput},validation:rule=>rule.required()}),
    defineField({name:'summary',title:'Course preview',type:'string',readOnly:true,components:{input:CourseSummary}}),
    defineField({name:'enabled',title:'Show this block on the website',type:'boolean',description:'Leave on, then Publish when the details are confirmed. Turn off and Publish to remove a block early.'}),
    defineField({name:'title',title:'Course name',type:'string',validation:rule=>rule.required().max(100)}),
    defineField({name:'academy',title:'Academy',type:'string',options:{list:academyIds.map(value=>({value,title:({'queenstown':'Queenstown','wanaka':'Wānaka','cromwell':'Cromwell','invercargill':'Invercargill','south-canterbury':'South Canterbury'})[value]}))},validation:rule=>rule.required()}),
    defineField({name:'weeks',title:'Number of weeks',type:'number',description:'Six weeks is prefilled. The finish date uses the final selected class day in the last week.',validation:rule=>rule.required().integer().min(1).max(52)}),
  ],
  preview:{select:{title:'title',academy:'academy',startDate:'startDate',weeks:'weeks',days:'days',startTime:'startTime',endTime:'endTime',enabled:'enabled'},prepare({title,...course}){
    return {title:title || 'Fundamentals Course',subtitle:[course.enabled===false?'Hidden':null,courseDateRange(course)||'Choose the first class date and days'].filter(Boolean).join(' · ')};
  }},
  orderings:[{title:'Starting date, newest first',name:'startDateDesc',by:[{field:'startDate',direction:'desc'}]}],
});
